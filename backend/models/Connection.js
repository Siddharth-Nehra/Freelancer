const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancerName: {
    type: String,
    required: true
  },
  freelancerEmail: {
    type: String,
    required: true
  },
  freelancerPhone: {
    type: String,
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactRequest'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  projectTitle: {
    type: String,
    default: 'Client Project'
  },
  projectDescription: {
    type: String,
    default: ''
  },
  budget: {
    type: String,
    default: ''
  },
  timeline: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['accepted', 'quit_emergency', 'completed'],
    default: 'accepted'
  },
  emergencyQuit: {
    isQuit: {
      type: Boolean,
      default: false
    },
    workUrl: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      default: ''
    },
    quitAt: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Connection', connectionSchema);

