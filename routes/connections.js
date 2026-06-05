const express = require('express');
const Connection = require('../models/Connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's connections
router.get('/my-connections', auth, async (req, res) => {
  try {
    let connections;
    
    if (req.user.type === 'freelancer') {
      connections = await Connection.find({
        freelancerId: req.user._id,
        status: 'accepted'
      }).sort({ createdAt: -1 });
    } else {
      connections = await Connection.find({
        clientId: req.user._id,
        status: 'accepted'
      }).sort({ createdAt: -1 });
    }

    res.json(connections.map(conn => ({
      id: conn._id,
      clientId: conn.clientId,
      clientName: conn.clientName,
      clientEmail: conn.clientEmail,
      clientPhone: conn.clientPhone,
      freelancerId: conn.freelancerId,
      freelancerName: conn.freelancerName,
      freelancerEmail: conn.freelancerEmail,
      freelancerPhone: conn.freelancerPhone,
      status: conn.status,
      createdAt: conn.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get connection by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Verify user has access to this connection
    const isAuthorized = 
      connection.freelancerId.toString() === req.user._id.toString() ||
      connection.clientId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      id: connection._id,
      clientId: connection.clientId,
      clientName: connection.clientName,
      clientEmail: connection.clientEmail,
      clientPhone: connection.clientPhone,
      freelancerId: connection.freelancerId,
      freelancerName: connection.freelancerName,
      freelancerEmail: connection.freelancerEmail,
      freelancerPhone: connection.freelancerPhone,
      status: connection.status,
      createdAt: connection.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

