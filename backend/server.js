require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test Schema
const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Test = mongoose.model('Test', TestSchema);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/contact-requests', require('./routes/contactRequests'));
app.use('/api/job-applications', require('./routes/jobApplications'));
app.use('/api/connections', require('./routes/connections'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FreelanceHub API is running'
  });
});

// Real-time Platform Statistics
app.get('/api/stats', async (req, res) => {
  try {
    const User = require('./models/User');
    const Job = require('./models/Job');
    const Connection = require('./models/Connection');

    const [freelancerCount, jobCount, connectionCount] = await Promise.all([
      User.countDocuments({ type: 'freelancer' }).catch(() => 0),
      Job.countDocuments({ status: 'open' }).catch(() => 0),
      Connection.countDocuments({ status: { $in: ['accepted', 'completed', 'quit_emergency'] } }).catch(() => 0)
    ]);

    res.json({
      success: true,
      stats: {
        freelancers: freelancerCount,
        jobs: jobCount,
        connections: connectionCount,
        secure: '100%'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Live Platform Activity Feed
app.get('/api/stats/activity', async (req, res) => {
  try {
    const Job = require('./models/Job');
    const Connection = require('./models/Connection');
    const JobApplication = require('./models/JobApplication');

    const [recentJobs, recentConnections, recentApps] = await Promise.all([
      Job.find().sort({ createdAt: -1 }).limit(3).catch(() => []),
      Connection.find().sort({ createdAt: -1 }).limit(3).catch(() => []),
      JobApplication.find().sort({ createdAt: -1 }).limit(3).catch(() => [])
    ]);

    const liveItems = [];

    recentApps.forEach(app => {
      liveItems.push({
        name: app.freelancerName || 'Freelancer',
        avatar: '',
        action: 'applied for',
        target: app.jobTitle || 'Job Opening',
        badgeIcon: 'fa-briefcase',
        badgeBg: '#762bff',
        time: 'Just now',
        timestamp: app.createdAt ? new Date(app.createdAt).getTime() : Date.now()
      });
    });

    recentConnections.forEach(conn => {
      liveItems.push({
        name: conn.freelancerName || 'Specialist',
        avatar: '',
        action: 'started project with',
        target: conn.clientName ? `${conn.clientName}` : 'a client',
        badgeIcon: 'fa-handshake',
        badgeBg: '#10b981',
        time: 'Recently',
        timestamp: conn.createdAt ? new Date(conn.createdAt).getTime() : Date.now() - 300000
      });
    });

    recentJobs.forEach(job => {
      liveItems.push({
        name: job.clientName || 'Client',
        avatar: '',
        action: 'posted a new opening',
        target: job.title || 'Project',
        badgeIcon: 'fa-plus',
        badgeBg: '#087bff',
        time: 'Recently',
        timestamp: job.createdAt ? new Date(job.createdAt).getTime() : Date.now() - 600000
      });
    });

    // Default realistic activity pool
    const fallbackItems = [
      { name: 'Priya S.', avatar: 'assets/avatars/priya.jpg', action: 'applied for', target: 'UI/UX Designer', badgeIcon: 'fa-briefcase', badgeBg: '#762bff', time: '2m ago' },
      { name: 'Arjun M.', avatar: 'assets/avatars/arjun.jpg', action: 'completed', target: 'Website Redesign (Milestone 2)', badgeIcon: 'fa-check', badgeBg: '#10b981', time: '5m ago' },
      { name: 'Sneha K.', avatar: 'assets/avatars/sneha.jpg', action: 'started a new project', target: 'AI Chatbot Development', badgeIcon: 'fa-code', badgeBg: '#087bff', time: '12m ago' },
      { name: 'Rohit V.', avatar: 'assets/avatars/rohit.jpg', action: 'earned', target: '$450 from a client', badgeIcon: 'fa-dollar-sign', badgeBg: '#10b981', time: '18m ago' },
      { name: 'Ananya D.', avatar: 'assets/avatars/ananya.jpg', action: 'was invited to', target: 'Web Development Project', badgeIcon: 'fa-user-plus', badgeBg: '#f000d8', time: '25m ago' }
    ];

    liveItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const combined = [...liveItems, ...fallbackItems].slice(0, 5);

    res.json({ success: true, activities: combined });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Interactive AI Assistant Endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { query } = req.body || {};
    const User = require('./models/User');
    const Job = require('./models/Job');

    const cleanQuery = (query || '').toLowerCase().trim();

    let freelancers = [];
    let jobs = [];

    if (cleanQuery.includes('dev') || cleanQuery.includes('react') || cleanQuery.includes('code') || cleanQuery.includes('python') || cleanQuery.includes('web') || cleanQuery.includes('design')) {
      freelancers = await User.find({
        type: 'freelancer',
        $or: [
          { 'profile.title': { $regex: cleanQuery, $options: 'i' } },
          { 'profile.skills': { $regex: cleanQuery, $options: 'i' } }
        ]
      }).limit(3);
    }

    if (cleanQuery.includes('job') || cleanQuery.includes('work') || cleanQuery.includes('project')) {
      jobs = await Job.find({ status: 'open' }).limit(3);
    }

    let reply = "";
    if (cleanQuery.includes('hire') || cleanQuery.includes('how to hire')) {
      reply = "To hire talent on FreelancerHub: 1) Browse our Freelancers directory, 2) Filter by your required skills or rate, 3) Click 'Contact' to send your project scope and directly exchange contact info.";
    } else if (cleanQuery.includes('post a job') || cleanQuery.includes('post job')) {
      reply = "To post a project: Sign in with a Client account, open your Client Dashboard, enter the job title, required skills, and budget, and hit Post Job. Freelancers will start submitting proposals immediately!";
    } else if (cleanQuery.includes('pay') || cleanQuery.includes('fee') || cleanQuery.includes('price')) {
      reply = "FreelancerHub connects clients and freelancers directly with 100% secure milestone tracking and 0 platform fee promotions for new accounts!";
    } else if (freelancers.length > 0) {
      reply = `I found ${freelancers.length} matching specialist(s): ${freelancers.map(f => `${f.name} (${f.profile?.title || 'Freelancer'})`).join(', ')}. Head over to 'Find Talent' to review their full profiles!`;
    } else if (jobs.length > 0) {
      reply = `We have open jobs available right now! Go to 'Find Jobs' to browse active listings and submit your proposal.`;
    } else {
      reply = `I'm FreelancerHub AI! I can help you search talent (Full-Stack, UI/UX, Python, DevOps, Writing), post projects, or guide you through the platform. What are you looking to build today?`;
    }

    res.json({
      success: true,
      reply,
      freelancers: freelancers.map(f => ({ id: f._id, name: f.name, title: f.profile?.title })),
      jobs: jobs.map(j => ({ id: j._id, title: j.title, budget: j.budget }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test MongoDB Save
app.get('/api/test-save', async (req, res) => {
  try {
    const data = await Test.create({
      name: 'Siddharth Test'
    });

    res.json({
      success: true,
      message: 'Data saved successfully',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Connect Database & Start Server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});