const express = require('express');
const Experiment = require('../models/Experiment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const experiments = await Experiment.find({ user: userId }).lean();

    const total = experiments.length;
    const completed = experiments.filter(e => e.status === 'completed').length;
    const failed = experiments.filter(e => e.status === 'failed').length;
    const inProgress = experiments.filter(e => e.status === 'in-progress').length;
    const drafts = experiments.filter(e => e.status === 'draft').length;

    // Monthly activity
    const monthly = {};
    experiments.forEach(e => {
      const key = new Date(e.createdAt).toISOString().slice(0, 7);
      if (!monthly[key]) monthly[key] = { created: 0, completed: 0, failed: 0 };
      monthly[key].created++;
      if (e.status === 'completed') monthly[key].completed++;
      if (e.status === 'failed') monthly[key].failed++;
    });

    // Tag distribution
    const tagCounts = {};
    experiments.forEach(e => (e.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));

    // Success ratings over time
    const ratingsOverTime = experiments
      .filter(e => e.successRating != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(e => ({ date: e.createdAt, rating: e.successRating, title: e.title }));

    // Weekly streak
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = experiments.filter(e => new Date(e.createdAt) >= weekAgo).length;

    res.json({
      overview: { total, completed, failed, inProgress, drafts },
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      monthly: Object.entries(monthly).sort().map(([month, data]) => ({ month, ...data })),
      tagDistribution: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count),
      ratingsOverTime,
      weeklyActivity: thisWeek,
      avgRating: ratingsOverTime.length > 0 ? Math.round(ratingsOverTime.reduce((s, r) => s + r.rating, 0) / ratingsOverTime.length * 10) / 10 : null
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

module.exports = router;
