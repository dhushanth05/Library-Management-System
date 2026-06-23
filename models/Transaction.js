const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  borrowDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue'],
    default: 'borrowed'
  }
}, {
  timestamps: true
});

// Method to calculate fine
transactionSchema.methods.calculateFine = function() {
  // If already returned, no additional fine
  if (this.returnDate) return this.fineAmount;
  
  const today = new Date();
  
  // If not yet due, no fine
  if (today <= this.dueDate) return 0;
  
  // Calculate days overdue
  const dueDate = new Date(this.dueDate);
  const timeDiff = Math.abs(today.getTime() - dueDate.getTime());
  const daysLate = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Calculate fine (₹10 per day)
  return daysLate * 10;
};

// Update status based on dates
transactionSchema.pre('save', function(next) {
  const today = new Date();
  
  if (this.returnDate) {
    this.status = 'returned';
  } else if (today > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'borrowed';
  }
  
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
