const express = require('express');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new member
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    // Check if member already exists
    let member = await Member.findOne({ email });
    if (member) {
      return res.status(400).json({ msg: 'Member already exists' });
    }
    
    // Set expiry date (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // Create new member
    member = new Member({
      name,
      email,
      password,
      phone,
      address,
      membershipType: 'standard',
      expiryDate,
      status: 'active'
    });
    
    await member.save();
    
    // Create and return JWT token
    const payload = {
      id: member.id,
      role: member.role
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        // Return token and user data
        const userData = {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.status
        };
        res.json({ token, user: userData });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if member exists
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await member.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check if member is active
    if (member.status !== 'active') {
      return res.status(400).json({ msg: 'Account is not active. Please contact the library.' });
    }
    
    // Create and return JWT token
    const payload = {
      id: member.id,
      role: member.role
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        // Return token and user data
        const userData = {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.status
        };
        res.json({ token, user: userData });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const member = await Member.findById(req.user.id).select('-password');
    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
