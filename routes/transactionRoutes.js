const express = require('express');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Fine = require('../models/Fine');
const { authenticate, isLibrarian, isMemberOrStaff } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/transactions/borrow
// @desc    Borrow a book (for librarians)
// @access  Private (Librarians only)
router.post('/borrow', authenticate, isLibrarian, async (req, res) => {
  try {
    const { bookId, memberId, dueDate } = req.body;
    
    // Check if book exists and has available copies
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    if (book.availableCopies <= 0) {
      return res.status(400).json({ msg: 'No copies available for borrowing' });
    }
    
    // Create new transaction
    const transaction = new Transaction({
      bookId,
      memberId,
      dueDate: new Date(dueDate)
    });
    
    // Update book available copies
    book.availableCopies -= 1;
    
    await Promise.all([transaction.save(), book.save()]);
    
    // Populate book and member details
    await transaction.populate('bookId memberId');
    
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/transactions/member/borrow
// @desc    Borrow a book (for members)
// @access  Private (Members can borrow for themselves)
router.post('/member/borrow', authenticate, async (req, res) => {
  try {
    const { bookId, dueDate } = req.body;
    const memberId = req.user.id; // Use the logged-in user's ID
    
    // Check if book exists and has available copies
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    if (book.availableCopies <= 0) {
      return res.status(400).json({ msg: 'No copies available for borrowing' });
    }
    
    // Create new transaction
    const transaction = new Transaction({
      bookId,
      memberId,
      dueDate: new Date(dueDate)
    });
    
    // Update book available copies
    book.availableCopies -= 1;
    
    await Promise.all([transaction.save(), book.save()]);
    
    // Populate book details
    await transaction.populate('bookId');
    
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/transactions/member/:id/return
// @desc    Return a borrowed book (for members)
// @access  Private (Members can return their own books)
router.put('/member/:id/return', authenticate, async (req, res) => {
  try {
    console.log('Member return book endpoint called');
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    // Verify that the member is returning their own book
    if (transaction.memberId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to return this book' });
    }
    
    if (transaction.status === 'returned') {
      return res.status(400).json({ msg: 'Book already returned' });
    }
    
    // Set return date to today
    transaction.returnDate = new Date();
    transaction.status = 'returned';
    
    // Update book available copies
    const book = await Book.findById(transaction.bookId);
    book.availableCopies += 1;
    
    // Check if book is returned late and create fine if needed
    const today = new Date();
    if (today > transaction.dueDate) {
      const daysLate = Math.ceil((today - transaction.dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysLate * 0.5; // $0.50 per day
      
      const fine = new Fine({
        memberId: transaction.memberId,
        transactionId: transaction._id,
        amount: fineAmount,
        reason: 'Overdue book return'
      });
      
      await fine.save();
    }
    
    await Promise.all([transaction.save(), book.save()]);
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/transactions/:id/return
// @desc    Return a borrowed book (for librarians)
// @access  Private (Librarians only)
router.put('/:id/return', authenticate, isLibrarian, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    if (transaction.status === 'returned') {
      return res.status(400).json({ msg: 'Book already returned' });
    }
    
    // Set return date to today
    transaction.returnDate = new Date();
    transaction.status = 'returned';
    
    // Update book available copies
    const book = await Book.findById(transaction.bookId);
    book.availableCopies += 1;
    
    // Check if book is returned late and create fine if needed
    const today = new Date();
    if (today > transaction.dueDate) {
      const daysLate = Math.ceil((today - transaction.dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysLate * 0.5; // $0.50 per day
      
      const fine = new Fine({
        memberId: transaction.memberId,
        transactionId: transaction._id,
        amount: fineAmount,
        reason: 'Overdue book return'
      });
      
      await fine.save();
    }
    
    await Promise.all([transaction.save(), book.save()]);
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/transactions
// @desc    Get all transactions (with optional pagination and filters)
// @access  Private (Librarians only)
router.get('/', authenticate, isLibrarian, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Apply filters if provided
    let query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.memberId) query.memberId = req.query.memberId;
    if (req.query.bookId) query.bookId = req.query.bookId;
    
    const total = await Transaction.countDocuments(query);
    
    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(limit)
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/transactions/member/:memberId
// @desc    Get transactions for a specific member
// @access  Private (Member or Staff)
router.get('/member/:memberId', authenticate, isMemberOrStaff, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { memberId: req.params.memberId };
    if (status) query.status = status;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Transaction.countDocuments(query);
    
    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(limit)
      .populate('bookId', 'title author isbn coverImage')
      .sort({ createdAt: -1 });
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/transactions/:id
// @desc    Get transaction by ID
// @access  Private (Member or Staff)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('bookId')
      .populate('memberId', 'name email');
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    // Check if user is authorized (either staff or the member involved)
    const isStaff = req.user.role === 'librarian' || req.user.role === 'admin';
    const isMember = req.user.id === transaction.memberId.toString();
    
    if (!isStaff && !isMember) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/transactions/:id/extend
// @desc    Extend due date for a borrowed book
// @access  Private (Librarians only)
router.put('/:id/extend', authenticate, isLibrarian, async (req, res) => {
  try {
    const { newDueDate } = req.body;
    
    if (!newDueDate) {
      return res.status(400).json({ msg: 'New due date is required' });
    }
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    if (transaction.status !== 'borrowed') {
      return res.status(400).json({ msg: 'Can only extend active borrowings' });
    }
    
    // Update due date
    transaction.dueDate = new Date(newDueDate);
    
    await transaction.save();
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/transactions/overdue
// @desc    Get all overdue transactions
// @access  Private (Librarians only)
router.get('/overdue', authenticate, isLibrarian, async (req, res) => {
  try {
    const today = new Date();
    
    const overdueTransactions = await Transaction.find({
      status: 'borrowed',
      dueDate: { $lt: today }
    })
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email')
      .sort({ dueDate: 1 });
    
    res.json(overdueTransactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/transactions/calculate-fines
// @desc    Calculate and update fines for all overdue books
// @access  Private (Librarians only)
router.get('/calculate-fines', authenticate, isLibrarian, async (req, res) => {
  try {
    const today = new Date();
    const overdueTransactions = await Transaction.find({
      status: 'borrowed',
      dueDate: { $lt: today },
      returnDate: null
    });
    
    const results = {
      processed: 0,
      finesCreated: 0,
      finesUpdated: 0
    };
    
    for (const transaction of overdueTransactions) {
      const daysLate = Math.ceil((today - transaction.dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysLate * 0.5; // $0.50 per day
      
      results.processed++;
      
      // Check if fine already exists for this transaction
      const existingFine = await Fine.findOne({ transactionId: transaction._id });
      
      if (existingFine) {
        // Update existing fine if amount has changed
        if (existingFine.amount !== fineAmount) {
          existingFine.amount = fineAmount;
          await existingFine.save();
          results.finesUpdated++;
        }
      } else {
        // Create new fine
        const fine = new Fine({
          memberId: transaction.memberId,
          transactionId: transaction._id,
          amount: fineAmount,
          reason: 'Overdue book'
        });
        
        await fine.save();
        results.finesCreated++;
      }
    }
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/transactions/:id/cancel
// @desc    Cancel a reservation (for librarians)
// @access  Private (Librarians only)
router.put('/:id/cancel', authenticate, isLibrarian, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    if (transaction.status !== 'reserved') {
      return res.status(400).json({ msg: 'Only reserved books can be cancelled' });
    }
    
    // Update transaction status
    transaction.status = 'cancelled';
    
    // Update book available copies
    const book = await Book.findById(transaction.bookId);
    book.availableCopies += 1;
    
    await Promise.all([transaction.save(), book.save()]);
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/transactions/member/:id/cancel
// @desc    Cancel a reservation (for members)
// @access  Private (Members can cancel their own reservations)
router.put('/member/:id/cancel', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    // Verify that the member is cancelling their own reservation
    if (transaction.memberId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to cancel this reservation' });
    }
    
    if (transaction.status !== 'reserved') {
      return res.status(400).json({ msg: 'Only reserved books can be cancelled' });
    }
    
    // Update transaction status
    transaction.status = 'cancelled';
    
    // Update book available copies
    const book = await Book.findById(transaction.bookId);
    book.availableCopies += 1;
    
    await Promise.all([transaction.save(), book.save()]);
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
