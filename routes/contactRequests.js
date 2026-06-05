const express = require('express');
const ContactRequest = require('../models/ContactRequest');
const Connection = require('../models/Connection');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create contact request (client to freelancer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can send contact requests' });
    }

    const { freelancerId, summary, budget, timeline } = req.body;

    if (!freelancerId || !summary) {
      return res.status(400).json({ message: 'Please provide freelancer ID and summary' });
    }

    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.type !== 'freelancer') {
      return res.status(404).json({ message: 'Freelancer not found' });
    }

    const request = new ContactRequest({
      clientId: req.user._id,
      clientName: req.user.name,
      clientEmail: req.user.email,
      clientPhone: req.user.phone,
      freelancerId,
      summary,
      budget: budget || '',
      timeline: timeline || '',
      status: 'pending'
    });

    await request.save();

    res.status(201).json({
      message: 'Contact request sent successfully',
      request: {
        id: request._id,
        clientId: request.clientId,
        clientName: request.clientName,
        freelancerId: request.freelancerId,
        summary: request.summary,
        budget: request.budget,
        timeline: request.timeline,
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contact requests for freelancer
router.get('/freelancer/my-requests', auth, async (req, res) => {
  try {
    if (req.user.type !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can view their requests' });
    }

    const requests = await ContactRequest.find({
      freelancerId: req.user._id,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json(requests.map(req => ({
      id: req._id,
      clientId: req.clientId,
      clientName: req.clientName,
      clientEmail: req.clientEmail,
      clientPhone: req.clientPhone,
      freelancerId: req.freelancerId,
      summary: req.summary,
      budget: req.budget,
      timeline: req.timeline,
      status: req.status,
      createdAt: req.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contact requests for client
router.get('/client/my-requests', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can view their requests' });
    }

    const requests = await ContactRequest.find({
      clientId: req.user._id
    }).sort({ createdAt: -1 });

    res.json(requests.map(req => ({
      id: req._id,
      clientId: req.clientId,
      clientName: req.clientName,
      freelancerId: req.freelancerId,
      summary: req.summary,
      budget: req.budget,
      timeline: req.timeline,
      status: req.status,
      createdAt: req.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept contact request (freelancer)
router.post('/:id/accept', auth, async (req, res) => {
  try {
    if (req.user.type !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can accept requests' });
    }

    const request = await ContactRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    if (request.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Create connection
    const connection = new Connection({
      clientId: request.clientId,
      clientName: request.clientName,
      clientEmail: request.clientEmail,
      clientPhone: request.clientPhone,
      freelancerId: req.user._id,
      freelancerName: req.user.name,
      freelancerEmail: req.user.email,
      freelancerPhone: req.user.phone,
      requestId: request._id,
      status: 'accepted'
    });

    await connection.save();

    res.json({
      message: 'Contact request accepted',
      connection: {
        id: connection._id,
        clientId: connection.clientId,
        clientName: connection.clientName,
        clientEmail: connection.clientEmail,
        clientPhone: connection.clientPhone,
        freelancerId: connection.freelancerId,
        freelancerName: connection.freelancerName,
        freelancerEmail: connection.freelancerEmail,
        freelancerPhone: connection.freelancerPhone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

