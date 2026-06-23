const express = require('express');
const Fine = require('../models/Fine');
const { authenticate, isLibrarian, isMemberOrStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/fines
// @desc    Get all fines (with optional pagination and filters)
// @access  Private (Librarians only)
router.get('/', authenticate, isLibrarian, async (req, res) => {
  try {
    const { paymentStatus, memberId } = req.query;
    
    let query = {};
    
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (memberId) query.memberId = memberId;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const fines = await Fine.find(query)
      .populate('memberId', 'name email')
      .populate({
        path: 'transactionId',
        populate: {
          path: 'bookId',
          select: 'title author isbn'
        }
      })
      .sort({ dateIssued: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Fine.countDocuments(query);
    
    res.json({
      fines,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/fines/member/:memberId
// @desc    Get fines for a specific member
// @access  Private (Member themselves or Staff)
router.get('/member/:memberId', authenticate, isMemberOrStaff, async (req, res) => {
  try {
    const { paymentStatus } = req.query;
    
    let query = { memberId: req.params.memberId };
    
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const fines = await Fine.find(query)
      .populate({
        path: 'transactionId',
        populate: {
          path: 'bookId',
          select: 'title author isbn'
        }
      })
      .sort({ dateIssued: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Fine.countDocuments(query);
    
    // Calculate total amount
    const totalAmount = await Fine.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    res.json({
      fines,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/fines/:id
// @desc    Get fine by ID
// @access  Private (Librarians or Member involved)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate('memberId', 'name email')
      .populate({
        path: 'transactionId',
        populate: {
          path: 'bookId',
          select: 'title author isbn'
        }
      });
    
    if (!fine) {
      return res.status(404).json({ msg: 'Fine not found' });
    }
    
    // Check if user is authorized (either staff or the member involved)
    const isStaff = req.user.role === 'librarian' || req.user.role === 'admin';
    const isMember = fine.memberId._id.toString() === req.user.id;
    
    if (!isStaff && !isMember) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    res.json(fine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Fine not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/fines/:id/pay
// @desc    Mark fine as paid
// @access  Private (Librarians only)
router.put('/:id/pay', authenticate, isLibrarian, async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ msg: 'Fine not found' });
    }
    
    if (fine.paymentStatus === 'paid') {
      return res.status(400).json({ msg: 'Fine already paid' });
    }
    
    // Update fine status
    fine.paymentStatus = 'paid';
    fine.paymentDate = new Date();
    
    await fine.save();
    
    res.json(fine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Fine not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/fines/:id/waive
// @desc    Waive a fine
// @access  Private (Librarians only)
router.put('/:id/waive', authenticate, isLibrarian, async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ msg: 'Fine not found' });
    }
    
    if (fine.paymentStatus !== 'pending') {
      return res.status(400).json({ msg: 'Can only waive pending fines' });
    }
    
    // Update fine status
    fine.paymentStatus = 'waived';
    fine.paymentDate = new Date();
    
    await fine.save();
    
    res.json(fine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Fine not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/fines/stats/summary
// @desc    Get summary statistics of fines
// @access  Private (Librarians only)
router.get('/stats/summary', authenticate, isLibrarian, async (req, res) => {
  try {
    // Total fines by status
    const finesByStatus = await Fine.aggregate([
      { $group: { 
          _id: "$paymentStatus", 
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    
    // Format the results
    const summary = {
      total: {
        count: 0,
        amount: 0
      },
      pending: {
        count: 0,
        amount: 0
      },
      paid: {
        count: 0,
        amount: 0
      },
      waived: {
        count: 0,
        amount: 0
      }
    };
    
    finesByStatus.forEach(item => {
      if (summary[item._id]) {
        summary[item._id].count = item.count;
        summary[item._id].amount = item.totalAmount;
        
        summary.total.count += item.count;
        summary.total.amount += item.totalAmount;
      }
    });
    
    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
