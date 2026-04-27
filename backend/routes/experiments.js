const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Experiment = require('../models/Experiment');
const Notification = require('../models/Notification');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/experiments — list user's experiments
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, tag, project, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };

    if (status) query.status = status;
    if (tag) query.tags = { $in: tag.split(',') };
    if (project) query.project = project;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Experiment.countDocuments(query);
    const experiments = await Experiment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('project', 'name color icon')
      .lean();

    res.json({
      experiments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List experiments error:', error);
    res.status(500).json({ error: 'Failed to fetch experiments.' });
  }
});

// GET /api/experiments/timeline — timeline view
router.get('/timeline', authenticate, async (req, res) => {
  try {
    const experiments = await Experiment.find({ user: req.user.id })
      .sort('-createdAt')
      .select('title status tags createdAt updatedAt successRating aiSummary')
      .populate('project', 'name color icon')
      .lean();

    // Group by month
    const timeline = {};
    experiments.forEach(exp => {
      const monthKey = new Date(exp.createdAt).toISOString().slice(0, 7);
      if (!timeline[monthKey]) timeline[monthKey] = [];
      timeline[monthKey].push(exp);
    });

    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline.' });
  }
});

// GET /api/experiments/shared/:shareToken — public shared experiment
router.get('/shared/:shareToken', optionalAuth, async (req, res) => {
  try {
    const experiment = await Experiment.findOne({ shareToken: req.params.shareToken })
      .populate('user', 'name avatar')
      .populate('project', 'name color icon');

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    experiment.viewCount += 1;
    await experiment.save();

    res.json({ experiment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiment.' });
  }
});

// GET /api/experiments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const experiment = await Experiment.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { visibility: 'public' }]
    })
      .populate('user', 'name avatar')
      .populate('project', 'name color icon');

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    res.json({ experiment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiment.' });
  }
});

// POST /api/experiments
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, objective, steps, results, status,
      tags, visibility, project, githubRepo, successRating
    } = req.body;

    const experiment = new Experiment({
      title,
      objective,
      steps: steps || '',
      results: results || '',
      status: status || 'draft',
      tags: tags || [],
      visibility: visibility || 'private',
      project: project || null,
      githubRepo: githubRepo || '',
      successRating: successRating || null,
      user: req.user.id,
      shareToken: uuidv4(),
      versions: [{
        versionNumber: 1,
        title,
        objective,
        steps: steps || '',
        results: results || '',
        changes: 'Initial version'
      }],
      currentVersion: 1
    });

    await experiment.save();
    await experiment.populate('project', 'name color icon');

    res.status(201).json({ message: 'Experiment created.', experiment });
  } catch (error) {
    console.error('Create experiment error:', error);
    res.status(500).json({ error: 'Failed to create experiment.' });
  }
});

// PUT /api/experiments/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const experiment = await Experiment.findOne({ _id: req.params.id, user: req.user.id });
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    const {
      title, objective, steps, results, status,
      tags, visibility, project, githubRepo, successRating,
      aiSummary, aiTags, aiRecommendations, createVersion
    } = req.body;

    // Create new version if requested
    if (createVersion) {
      const newVersionNumber = experiment.currentVersion + 1;
      experiment.versions.push({
        versionNumber: newVersionNumber,
        title: title || experiment.title,
        objective: objective || experiment.objective,
        steps: steps || experiment.steps,
        results: results || experiment.results,
        changes: req.body.versionChanges || 'Updated experiment'
      });
      experiment.currentVersion = newVersionNumber;
    }

    // Update fields
    if (title) experiment.title = title;
    if (objective) experiment.objective = objective;
    if (steps !== undefined) experiment.steps = steps;
    if (results !== undefined) experiment.results = results;
    if (status) experiment.status = status;
    if (tags) experiment.tags = tags;
    if (visibility) experiment.visibility = visibility;
    if (project !== undefined) experiment.project = project;
    if (githubRepo !== undefined) experiment.githubRepo = githubRepo;
    if (successRating !== undefined) experiment.successRating = successRating;
    if (aiSummary) experiment.aiSummary = aiSummary;
    if (aiTags) experiment.aiTags = aiTags;
    if (aiRecommendations) experiment.aiRecommendations = aiRecommendations;

    await experiment.save();
    await experiment.populate('project', 'name color icon');

    res.json({ message: 'Experiment updated.', experiment });
  } catch (error) {
    console.error('Update experiment error:', error);
    res.status(500).json({ error: 'Failed to update experiment.' });
  }
});

// DELETE /api/experiments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const experiment = await Experiment.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    res.json({ message: 'Experiment deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experiment.' });
  }
});

// GET /api/experiments/:id/versions — version history
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const experiment = await Experiment.findOne(
      { _id: req.params.id, user: req.user.id },
      'versions currentVersion title'
    );

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    res.json({
      versions: experiment.versions,
      currentVersion: experiment.currentVersion
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions.' });
  }
});

// POST /api/experiments/:id/share — generate share link
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const experiment = await Experiment.findOne({ _id: req.params.id, user: req.user.id });
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found.' });
    }

    if (!experiment.shareToken) {
      experiment.shareToken = uuidv4();
      await experiment.save();
    }

    experiment.visibility = 'public';
    await experiment.save();

    res.json({
      shareToken: experiment.shareToken,
      shareUrl: `/shared/${experiment.shareToken}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate share link.' });
  }
});

// POST /api/experiments/export
router.post('/export', authenticate, async (req, res) => {
  try {
    const { format = 'json', experimentIds } = req.body;
    const query = { user: req.user.id };
    if (experimentIds && experimentIds.length > 0) {
      query._id = { $in: experimentIds };
    }

    const experiments = await Experiment.find(query)
      .populate('project', 'name')
      .lean();

    if (format === 'csv') {
      const headers = 'Title,Objective,Status,Tags,Success Rating,Created At\n';
      const rows = experiments.map(e =>
        `"${e.title}","${e.objective}","${e.status}","${(e.tags || []).join('; ')}","${e.successRating || 'N/A'}","${e.createdAt}"`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=experiments.csv');
      return res.send(headers + rows);
    }

    res.json({ experiments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export experiments.' });
  }
});

module.exports = router;
