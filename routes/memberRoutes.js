const express = require('express');
const Member = require('../models/Member');
const { authenticate, isAdmin, isLibrarian, isMemberOrStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/members
// @desc    Get all members (with optional pagination)
// @access  Private (Librarians and Admins only)
router.get('/', authenticate, isLibrarian, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const members = await Member.find()
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Member.countDocuments();
    
    res.json({
      members,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/members/search
// @desc    Search for members
// @access  Private (Librarians and Admins only)
router.get('/search', authenticate, isLibrarian, async (req, res) => {
  try {
    const { name, email, status, membershipType } = req.query;
    
    let searchQuery = {};
    
    if (name) searchQuery.name = { $regex: name, $options: 'i' };
    if (email) searchQuery.email = { $regex: email, $options: 'i' };
    if (status) searchQuery.status = status;
    if (membershipType) searchQuery.membershipType = membershipType;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const members = await Member.find(searchQuery)
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Member.countDocuments(searchQuery);
    
    res.json({
      members,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/members/:id
// @desc    Get member by ID
// @access  Private (Member themselves or Staff)
router.get('/:id', authenticate, isMemberOrStaff, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select('-password');
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    res.json(member);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Member not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/members/:id
// @desc    Update member
// @access  Private (Member themselves or Staff)
router.put('/:id', authenticate, isMemberOrStaff, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    // Prepare update fields
    const updateFields = {};
    const allowedFields = ['name', 'phone', 'address'];
    
    // Regular members can only update certain fields
    if (req.user.role === 'member' && req.user.id === req.params.id) {
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      }
    } 
    // Staff can update all fields
    else if (req.user.role === 'librarian' || req.user.role === 'admin') {
      for (const [key, value] of Object.entries(req.body)) {
        // Don't allow password update through this route
        if (key !== 'password' && key !== '_id') {
          updateFields[key] = value;
        }
      }
    }
    
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    res.json(updatedMember);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Member not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/members/:id
// @desc    Delete member
// @access  Private (Admins only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    await member.deleteOne();
    res.json({ msg: 'Member removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Member not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/members/:id/change-password
// @desc    Change member password
// @access  Private (Member themselves or Admin)
router.put('/:id/change-password', authenticate, isMemberOrStaff, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    // If it's the member changing their own password, verify current password
    if (req.user.role === 'member' && req.user.id === req.params.id) {
      const isMatch = await member.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Current password is incorrect' });
      }
    }
    
    // Update password
    member.password = newPassword;
    await member.save();
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
