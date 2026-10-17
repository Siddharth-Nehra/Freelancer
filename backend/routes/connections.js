const express = require('express');
const Connection = require('../models/Connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper to extract work details from connection or populated models
const extractWorkDetails = (conn) => {
  const reqData = conn.requestId || {};
  const jobData = conn.jobId || {};
  const projectTitle = conn.projectTitle || jobData.title || (reqData.summary ? (reqData.summary.length > 40 ? reqData.summary.slice(0, 40) + '...' : reqData.summary) : 'Client Project');
  const projectDescription = conn.projectDescription || jobData.description || reqData.summary || 'Project work details as shared when connected with client.';
  const budget = conn.budget || (jobData.budget ? `$${jobData.budget}` : reqData.budget) || 'Agreed in discussion';
  const timeline = conn.timeline || reqData.timeline || 'Agreed schedule';

  return {
    projectTitle,
    projectDescription,
    budget,
    timeline
  };
};

// Get user's connections
router.get('/my-connections', auth, async (req, res) => {
  try {
    let connections;
    
    if (req.user.type === 'freelancer') {
      connections = await Connection.find({
        freelancerId: req.user._id,
        status: { $in: ['accepted', 'quit_emergency', 'completed'] }
      }).populate('requestId').populate('jobId').sort({ createdAt: -1 });
    } else {
      connections = await Connection.find({
        clientId: req.user._id,
        status: { $in: ['accepted', 'quit_emergency', 'completed'] }
      }).populate('requestId').populate('jobId').sort({ createdAt: -1 });
    }

    res.json(connections.map(conn => {
      const details = extractWorkDetails(conn);
      return {
        id: conn._id,
        clientId: conn.clientId,
        clientName: conn.clientName,
        clientEmail: conn.clientEmail,
        clientPhone: conn.clientPhone,
        freelancerId: conn.freelancerId,
        freelancerName: conn.freelancerName,
        freelancerEmail: conn.freelancerEmail,
        freelancerPhone: conn.freelancerPhone,
        projectTitle: details.projectTitle,
        projectDescription: details.projectDescription,
        budget: details.budget,
        timeline: details.timeline,
        status: conn.status,
        emergencyQuit: conn.emergencyQuit || { isQuit: false, workUrl: '', reason: '' },
        createdAt: conn.createdAt
      };
    }));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get connection by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id).populate('requestId').populate('jobId');
    
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

    const details = extractWorkDetails(connection);

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
      projectTitle: details.projectTitle,
      projectDescription: details.projectDescription,
      budget: details.budget,
      timeline: details.timeline,
      status: connection.status,
      emergencyQuit: connection.emergencyQuit || { isQuit: false, workUrl: '', reason: '' },
      createdAt: connection.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Emergency quit project (freelancer)
router.post('/:id/emergency-quit', auth, async (req, res) => {
  try {
    if (req.user.type !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can quit their projects' });
    }

    const { workUrl, reason } = req.body;

    if (!workUrl || !workUrl.trim()) {
      return res.status(400).json({ message: 'Please provide the URL of the work completed so far' });
    }

    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to quit this project' });
    }

    if (connection.status === 'quit_emergency') {
      return res.status(400).json({ message: 'This project has already been marked as quit' });
    }

    connection.status = 'quit_emergency';
    connection.emergencyQuit = {
      isQuit: true,
      workUrl: workUrl.trim(),
      reason: reason ? reason.trim() : 'Emergency withdrawal requested by freelancer',
      quitAt: new Date()
    };

    await connection.save();

    res.json({
      message: 'Emergency quit recorded successfully. Your work URL has been submitted.',
      connection: {
        id: connection._id,
        status: connection.status,
        emergencyQuit: connection.emergencyQuit
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

