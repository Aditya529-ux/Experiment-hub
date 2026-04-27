const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const Experiment = require('../models/Experiment');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR || './uploads', req.user.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|txt|md|py|js|ts|json|csv|zip/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('File type not supported.'));
  }
});

router.post('/:experimentId', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    const experiment = await Experiment.findOne({ _id: req.params.experimentId, user: req.user.id });
    if (!experiment) return res.status(404).json({ error: 'Experiment not found.' });

    const attachments = req.files.map(f => ({
      filename: f.filename, originalName: f.originalname,
      mimetype: f.mimetype, size: f.size,
      path: `/uploads/${req.user.id}/${f.filename}`
    }));

    experiment.attachments.push(...attachments);
    await experiment.save();
    res.json({ message: 'Files uploaded.', attachments });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed.' });
  }
});

router.delete('/:experimentId/:filename', authenticate, async (req, res) => {
  try {
    const experiment = await Experiment.findOne({ _id: req.params.experimentId, user: req.user.id });
    if (!experiment) return res.status(404).json({ error: 'Experiment not found.' });

    experiment.attachments = experiment.attachments.filter(a => a.filename !== req.params.filename);
    await experiment.save();

    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', req.user.id, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'File deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed.' });
  }
});

module.exports = router;
