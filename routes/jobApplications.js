const express = require('express');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
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

module.exports = router;

