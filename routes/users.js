const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all freelancers
router.get('/freelancers', async (req, res) => {
  try {
    const { search, skill } = req.query;
    
    let query = { type: 'freelancer' };
    
    // Filter by profile completion (must have title)
    query['profile.title'] = { $exists: true, $ne: '' };
    
    const freelancers = await User.find(query);
    
    // Filter by search and skill
    let filtered = freelancers.filter(f => {
      const matchesSearch = !search || 
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.profile.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.profile.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()));
      
      const matchesSkill = !skill || 
        (f.profile.skills || []).some(s => s.toLowerCase().includes(skill.toLowerCase()));
      
      return matchesSearch && matchesSkill;
    });
    
    res.json(filtered.map(f => ({
      id: f._id,
      name: f.name,
      email: f.email,
      phone: f.phone,
      type: f.type,
      profile: f.profile
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update profile fields
    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
    }
    
    // Update other fields if provided
    if (updates.name) user.name = updates.name;
    if (updates.phone) user.phone = updates.phone;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        type: user.type,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

