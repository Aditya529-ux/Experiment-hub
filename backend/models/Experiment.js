const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  title: { type: String, required: true },
  objective: { type: String },
  steps: { type: String },
  results: { type: String },
  changes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const experimentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Experiment title is required'],
    trim: true,
    maxlength: 200
  },
  objective: {
    type: String,
    required: [true, 'Objective is required'],
    maxlength: 5000
  },
  steps: {
    type: String,
    maxlength: 20000,
    default: ''
  },
  results: {
    type: String,
    maxlength: 10000,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'failed', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  aiTags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  aiSummary: {
    type: String,
    default: ''
  },
  aiRecommendations: [{
    type: String
  }],
  successRating: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'team'],
    default: 'private'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  githubRepo: {
    type: String,
    default: ''
  },
  versions: [versionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for search performance
experimentSchema.index({ title: 'text', objective: 'text', steps: 'text', results: 'text' });
experimentSchema.index({ user: 1, createdAt: -1 });
experimentSchema.index({ tags: 1 });
experimentSchema.index({ status: 1 });
experimentSchema.index({ project: 1 });
experimentSchema.index({ shareToken: 1 });

module.exports = mongoose.model('Experiment', experimentSchema);
