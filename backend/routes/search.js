const express = require('express');
const Experiment = require('../models/Experiment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { q, tags, status, dateFrom, dateTo, minRating, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { objective: { $regex: q, $options: 'i' } },
        { steps: { $regex: q, $options: 'i' } },
        { results: { $regex: q, $options: 'i' } }
      ];
    }
    if (tags) query.tags = { $in: tags.split(',').map(t => t.trim()) };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    if (minRating) query.successRating = { $gte: parseInt(minRating) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Experiment.countDocuments(query);
    const experiments = await Experiment.find(query)
      .sort(sort).skip(skip).limit(parseInt(limit))
      .populate('project', 'name color icon').lean();

    res.json({ experiments, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ error: 'Search failed.' });
  }
});

module.exports = router;
