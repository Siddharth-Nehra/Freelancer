const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['freelancer', 'client'],
    required: true
  },
  profile: {
    // Freelancer profile fields
    title: String,
    rate: Number,
    skills: [String],
    bio: String,
    portfolio: String,
    availability: {
      type: String,
      enum: ['Available', 'Limited', 'Busy'],
      default: 'Available'
    },
    experience: Number,
    // Client profile fields
    company: String,
    industry: String,
    about: String,
    website: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

