const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'xp-tracker-jwt-secret-2024';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const user = new User({ name, email: email.toLowerCase(), password });
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        preferences: user.preferences,
        githubUrl: user.githubUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, bio, avatar, skills, githubUrl, preferences } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existingUser) return res.status(409).json({ error: 'Email already in use.' });
      updates.email = email.toLowerCase();
    }
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (skills) updates.skills = skills;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;
    if (preferences) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ message: 'Profile updated.', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/seed-demo-data
router.post('/seed-demo-data', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const Project = require('../models/Project');
    const Experiment = require('../models/Experiment');
    
    const project = new Project({
      name: 'Machine Learning Portfolio',
      description: 'Various ML experiments and models',
      icon: '🤖',
      color: '#8b5cf6',
      user: user._id,
      members: [{ user: user._id, role: 'owner' }]
    });
    await project.save();

    const now = new Date();
    const experiments = [];

    for (let i = 0; i < 25; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      let status, rating;
      if (daysAgo < 30) {
        status = Math.random() > 0.2 ? 'completed' : 'in-progress';
        rating = Math.floor(Math.random() * 3) + 7;
      } else if (daysAgo < 90) {
        status = Math.random() > 0.4 ? 'completed' : 'failed';
        rating = Math.floor(Math.random() * 4) + 5;
      } else {
        status = Math.random() > 0.6 ? 'completed' : 'failed';
        rating = Math.floor(Math.random() * 4) + 3;
      }

      experiments.push({
        title: `Experiment ${i + 1}: ${['Neural Network', 'Decision Tree', 'Clustering', 'API Build', 'React UI'][i % 5]}`,
        objective: 'Testing out various approaches and documenting results.',
        steps: '1. Data prep\n2. Model training\n3. Evaluation',
        results: status === 'completed' ? 'Successfully implemented and achieved 90% accuracy.' : 'Failed due to memory issues.',
        status: status,
        tags: [['ai', 'ml'], ['web', 'react'], ['python', 'data-science'], ['devops']][i % 4],
        successRating: rating,
        project: project._id,
        user: user._id,
        createdAt: date,
        updatedAt: date
      });
    }

    await Experiment.insertMany(experiments);
    res.json({ message: 'Seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

module.exports = router;
