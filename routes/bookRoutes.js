const express = require('express');
const Book = require('../models/Book');
const { authenticate, isLibrarian } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/books
// @desc    Add a new book
// @access  Private (Librarians only)
router.post('/', authenticate, isLibrarian, async (req, res) => {
  try {
    const { 
      title, 
      author, 
      isbn, 
      publicationYear, 
      publisher, 
      genre, 
      description, 
      totalCopies, 
      shelfLocation 
    } = req.body;
    
    // Check if book with ISBN already exists
    let book = await Book.findOne({ isbn });
    if (book) {
      return res.status(400).json({ msg: 'Book with this ISBN already exists' });
    }
    
    // Create new book
    book = new Book({
      title,
      author,
      isbn,
      publicationYear,
      publisher,
      genre,
      description,
      totalCopies,
      availableCopies: totalCopies, // Initially all copies are available
      shelfLocation
    });
    
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/books
// @desc    Get all books (with optional pagination)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24; // Increased default limit from 10 to 24
    const skip = (page - 1) * limit;
    
    // Optional sorting
    const sortField = req.query.sortBy || 'title';
    const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;
    
    console.log(`Getting books - page: ${page}, limit: ${limit}, skip: ${skip}`);
    
    const books = await Book.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    const total = await Book.countDocuments();
    console.log(`Found ${total} total books, returning ${books.length} books`);
    
    res.json({
      books,
      total, // Added total count 
      limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/books/search
// @desc    Advanced search for books
// @access  Public
router.get('/search', async (req, res) => {
  try {
    console.log('Search endpoint called with query params:', req.query);
    
    const { 
      title, 
      author, 
      isbn, 
      genre, 
      publisher, 
      yearFrom, 
      yearTo, 
      available,
      query
    } = req.query;
    
    let searchQuery = {};
    
    // Text search (if query parameter is provided)
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    // Filter by specific fields - using case-insensitive regex search
    if (title) {
      searchQuery.title = { $regex: title, $options: 'i' };
      console.log(`Searching for title containing: ${title}`);
    }
    
    if (author) {
      searchQuery.author = { $regex: author, $options: 'i' };
      console.log(`Searching for author containing: ${author}`);
    }
    
    if (isbn) {
      searchQuery.isbn = { $regex: isbn, $options: 'i' };
      console.log(`Searching for ISBN containing: ${isbn}`);
    }
    
    if (genre) {
      searchQuery.genre = { $regex: genre, $options: 'i' };
      console.log(`Searching for genre containing: ${genre}`);
    }
    
    if (publisher) {
      searchQuery.publisher = { $regex: publisher, $options: 'i' };
      console.log(`Searching for publisher containing: ${publisher}`);
    }
    
    // Publication year range
    if (yearFrom || yearTo) {
      searchQuery.publicationYear = {};
      if (yearFrom) searchQuery.publicationYear.$gte = parseInt(yearFrom);
      if (yearTo) searchQuery.publicationYear.$lte = parseInt(yearTo);
    }
    
    // Availability filter
    if (available === 'true') {
      searchQuery.availableCopies = { $gt: 0 };
    } else if (available === 'false') {
      searchQuery.availableCopies = 0;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24; 
    const skip = (page - 1) * limit;
    
    // Optional sorting
    const sortField = req.query.sortBy || 'title';
    const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;
    
    console.log('Search query:', JSON.stringify(searchQuery));
    console.log(`Search books - page: ${page}, limit: ${limit}, skip: ${skip}`);
    
    // Execute search
    const books = await Book.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    const total = await Book.countDocuments(searchQuery);
    console.log(`Found ${total} matching books, returning ${books.length} books`);
    
    res.json({
      books,
      total, 
      limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/books/:id
// @desc    Get book by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    res.json(book);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/books/:id
// @desc    Update book
// @access  Private (Librarians only)
router.put('/:id', authenticate, isLibrarian, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      // Don't allow direct modification of availableCopies
      if (key !== 'availableCopies') {
        updateFields[key] = value;
      }
    }
    
    // If totalCopies is being updated, adjust availableCopies accordingly
    if (req.body.totalCopies !== undefined) {
      const diff = req.body.totalCopies - book.totalCopies;
      updateFields.availableCopies = Math.max(0, book.availableCopies + diff);
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json(updatedBook);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/books/:id
// @desc    Delete book
// @access  Private (Librarians only)
router.delete('/:id', authenticate, isLibrarian, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    await book.deleteOne();
    res.json({ msg: 'Book removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
