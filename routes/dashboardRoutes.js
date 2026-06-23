const express = require('express');
const Member = require('../models/Member');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const { authenticate, isLibrarian } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Librarians and Admins only)
router.get('/stats', authenticate, isLibrarian, async (req, res) => {
  try {
    // Get book stats
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$availableCopies' }
        }
      }
    ]);

    // Get member stats
    const totalMembers = await Member.countDocuments({ role: 'member' });
    const activeMembers = await Member.countDocuments({ role: 'member', status: 'active' });

    // Get transaction stats
    const totalBorrowed = await Transaction.countDocuments({ status: 'borrowed' });
    const overdue = await Transaction.countDocuments({
      status: 'borrowed',
      dueDate: { $lt: new Date() }
    });

    // Get fine stats
    const pendingFines = await Fine.aggregate([
      {
        $match: { paymentStatus: 'pending' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      totalBooks,
      availableBooks: availableBooks.length > 0 ? availableBooks[0].total : 0,
      totalMembers,
      activeMembers,
      totalBorrowed,
      overdue,
      pendingFines: pendingFines.length > 0 ? pendingFines[0].total : 0
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
