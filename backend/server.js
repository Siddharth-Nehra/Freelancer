require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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