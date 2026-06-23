const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import routes
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const fineRoutes = require('./routes/fineRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    // Create admin user if it doesn't exist
    createAdminUser();
  })
  .catch(err => console.error('Could not connect to MongoDB Atlas', err));

// Function to create admin user if it doesn't exist
async function createAdminUser() {
  try {
    // Import Member model
    const Member = require('./models/Member');
    
    // Check if admin user exists
    const adminExists = await Member.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      
      // Set expiry date (1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      // Create admin user
      const adminUser = new Member({
        name: 'Admin User',
        email: 'admin@library.com',
        phone: '1234567890',
        address: 'Library Address',
        membershipType: 'premium',
        expiryDate: expiryDate,
        status: 'active',
        password: 'admin123',  // This will be hashed by the pre-save hook in the Member model
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Admin login credentials:');
      console.log('Email: admin@library.com');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route for member portal
app.get('/member', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'member.html'));
});

// Serve the admin frontend for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
