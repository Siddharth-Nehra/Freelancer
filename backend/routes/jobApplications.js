const express = require('express');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const User = require('../models/User');
const Connection = require('../models/Connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply to job (freelancer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.type !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can apply to jobs' });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Please provide job ID' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      freelancerId: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const application = new JobApplication({
      jobId,
      jobTitle: job.title,
      freelancerId: req.user._id,
      freelancerName: req.user.name,
      clientId: job.clientId,
      status: 'pending'
    });

    await application.save();

    res.status(201).json({
      message: 'Application sent successfully',
      application: {
        id: application._id,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        freelancerId: application.freelancerId,
        freelancerName: application.freelancerName,
        clientId: application.clientId,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get freelancer's applications
router.get('/freelancer/my-applications', auth, async (req, res) => {
  try {
    if (req.user.type !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can view their applications' });
    }

    const applications = await JobApplication.find({
      freelancerId: req.user._id
    }).sort({ createdAt: -1 });

    res.json(applications.map(app => ({
      id: app._id,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      freelancerId: app.freelancerId,
      freelancerName: app.freelancerName,
      clientId: app.clientId,
      status: app.status,
      createdAt: app.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get job applications for client
router.get('/client/my-applications', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can view job applications' });
    }

    const applications = await JobApplication.find({
      clientId: req.user._id
    }).sort({ createdAt: -1 });

    res.json(applications.map(app => ({
      id: app._id,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      freelancerId: app.freelancerId,
      freelancerName: app.freelancerName,
      clientId: app.clientId,
      status: app.status,
      createdAt: app.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept job application (client)
router.post('/:id/accept', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can accept job applications' });
    }

    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Job application not found' });
    }

    if (application.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application already processed' });
    }

    const freelancer = await User.findById(application.freelancerId);
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }

    application.status = 'accepted';
    await application.save();

    let connection = await Connection.findOne({
      clientId: req.user._id,
      freelancerId: freelancer._id
    });

    if (!connection) {
      connection = new Connection({
        clientId: req.user._id,
        clientName: req.user.name,
        clientEmail: req.user.email,
        clientPhone: req.user.phone,
        freelancerId: freelancer._id,
        freelancerName: freelancer.name,
        freelancerEmail: freelancer.email,
        freelancerPhone: freelancer.phone,
        status: 'accepted'
      });
      await connection.save();
    }

    res.json({
      message: 'Job application accepted',
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

