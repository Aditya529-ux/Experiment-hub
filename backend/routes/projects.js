const express = require('express');
const Project = require('../models/Project');
const Experiment = require('../models/Experiment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — list user's projects
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { user: req.user.id },
        { 'members.user': req.user.id }
      ],
      archived: false
    }).sort('-updatedAt').lean();

    // Count experiments per project
    const projectIds = projects.map(p => p._id);
    const counts = await Experiment.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const enriched = projects.map(p => ({
      ...p,
      experimentCount: countMap[p._id.toString()] || 0
    }));

    res.json({ projects: enriched });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { 'members.user': req.user.id }]
    }).populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const experiments = await Experiment.find({ project: req.params.id })
      .sort('-updatedAt')
      .select('title status tags createdAt updatedAt successRating')
      .lean();

    res.json({ project, experiments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// POST /api/projects
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, color, icon, visibility, tags } = req.body;

    const project = new Project({
      name,
      description: description || '',
      color: color || '#6366f1',
      icon: icon || '🧪',
      visibility: visibility || 'private',
      tags: tags || [],
      user: req.user.id,
      members: [{ user: req.user.id, role: 'owner' }]
    });

    await project.save();
    res.status(201).json({ message: 'Project created.', project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const { name, description, color, icon, visibility, tags, archived } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (icon) project.icon = icon;
    if (visibility) project.visibility = visibility;
    if (tags) project.tags = tags;
    if (archived !== undefined) project.archived = archived;

    await project.save();
    res.json({ message: 'Project updated.', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Unlink experiments from project
    await Experiment.updateMany({ project: req.params.id }, { project: null });

    res.json({ message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// POST /api/projects/:id/members — add team member
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { userId, role = 'viewer' } = req.body;
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const exists = project.members.find(m => m.user.toString() === userId);
    if (exists) {
      return res.status(400).json({ error: 'User is already a member.' });
    }

    project.members.push({ user: userId, role });
    await project.save();

    res.json({ message: 'Member added.', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

module.exports = router;
