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
  status: {
    type: String,
    enum: ['accepted'],
    default: 'accepted'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Connection', connectionSchema);

