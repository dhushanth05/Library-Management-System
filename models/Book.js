const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  publicationYear: {
    type: Number,
    required: true
  },
  publisher: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  shelfLocation: {
    type: String,
    trim: true
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for search functionality
bookSchema.index({ 
  title: 'text', 
  author: 'text', 
  genre: 'text', 
  publisher: 'text',
  isbn: 'text',
  description: 'text'
});

module.exports = mongoose.model('Book', bookSchema);
