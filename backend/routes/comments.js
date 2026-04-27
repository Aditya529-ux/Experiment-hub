const express = require('express');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Experiment = require('../models/Experiment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:experimentId', authenticate, async (req, res) => {
  try {
    const comments = await Comment.find({ experiment: req.params.experimentId })
      .sort('createdAt').populate('user', 'name avatar').lean();
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

router.post('/:experimentId', authenticate, async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const experiment = await Experiment.findById(req.params.experimentId);
    if (!experiment) return res.status(404).json({ error: 'Experiment not found.' });

    const comment = new Comment({
      content, experiment: req.params.experimentId,
      user: req.user.id, parentComment: parentComment || null
    });
    await comment.save();
    await comment.populate('user', 'name avatar');

    if (experiment.user.toString() !== req.user.id) {
      await Notification.create({
        user: experiment.user, type: 'comment', title: 'New Comment',
        message: `${req.user.name} commented on "${experiment.title}"`,
        link: `/experiments/${experiment._id}`
      });
    }
    res.status(201).json({ message: 'Comment added.', comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

module.exports = router;
