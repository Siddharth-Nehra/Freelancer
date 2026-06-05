const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all open jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' }).sort({ createdAt: -1 });
    res.json(jobs.map(job => ({
      id: job._id,
      clientId: job.clientId,
      clientName: job.clientName,
      title: job.title,
      description: job.description,
      budget: job.budget,
      skills: job.skills,
      status: job.status,
      createdAt: job.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({
      id: job._id,
      clientId: job.clientId,
      clientName: job.clientName,
      title: job.title,
      description: job.description,
      budget: job.budget,
      skills: job.skills,
      status: job.status,
      createdAt: job.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create job (client only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can post jobs' });
    }

    const { title, description, budget, skills } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({ message: 'Please provide title, description, and budget' });
    }

    const job = new Job({
      clientId: req.user._id,
      clientName: req.user.name,
      title,
      description,
      budget: parseFloat(budget),
      skills: skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
      status: 'open'
    });

    await job.save();

    res.status(201).json({
      message: 'Job posted successfully',
      job: {
        id: job._id,
        clientId: job.clientId,
        clientName: job.clientName,
        title: job.title,
        description: job.description,
        budget: job.budget,
        skills: job.skills,
        status: job.status,
        createdAt: job.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get client's jobs
router.get('/client/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can view their jobs' });
    }

    const jobs = await Job.find({ clientId: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs.map(job => ({
      id: job._id,
      clientId: job.clientId,
      clientName: job.clientName,
      title: job.title,
      description: job.description,
      budget: job.budget,
      skills: job.skills,
      status: job.status,
      createdAt: job.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

