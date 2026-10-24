const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

const router = express.Router();

// Get client's jobs (must be before /:id)
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

function formatJob(job) {
  return {
    id: job._id,
    clientId: job.clientId,
    clientName: job.clientName,
    title: job.title,
    description: job.description,
    budget: job.budget,
    skills: job.skills,
    status: job.status,
    createdAt: job.createdAt
  };
}

// Update job (client owner)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can update jobs' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, budget, skills, status } = req.body;
    if (title) job.title = title;
    if (description) job.description = description;
    if (budget !== undefined) job.budget = parseFloat(budget);
    if (skills !== undefined) {
      job.skills = Array.isArray(skills)
        ? skills
        : String(skills).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (status && ['open', 'closed', 'in-progress', 'completed'].includes(status)) {
      job.status = status;
    }

    await job.save();
    res.json({ message: 'Job updated successfully', job: formatJob(job) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Close job (client owner)
router.post('/:id/close', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can close jobs' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    job.status = 'closed';
    await job.save();
    res.json({ message: 'Job closed successfully', job: formatJob(job) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete job (client owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Only clients can delete jobs' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

