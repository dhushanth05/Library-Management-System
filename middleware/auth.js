const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    const member = await Member.findById(req.user.id);
    
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Middleware to check if user is librarian or admin
exports.isLibrarian = async (req, res, next) => {
  try {
    const member = await Member.findById(req.user.id);
    
    if (!member || (member.role !== 'librarian' && member.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied. Librarian privileges required.' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Middleware to check if user is the member themselves or a librarian/admin
exports.isMemberOrStaff = async (req, res, next) => {
  try {
    const member = await Member.findById(req.user.id);
    
    // Allow if user is the member themselves
    if (member && member._id.toString() === req.params.memberId) {
      return next();
    }
    
    // Allow if user is librarian or admin
    if (member && (member.role === 'librarian' || member.role === 'admin')) {
      return next();
    }
    
    return res.status(403).json({ msg: 'Access denied. Not authorized.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
