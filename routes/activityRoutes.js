const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// GET /api/activity — all logs, newest first
// ?limit=N  — cap results (default 50)
// ?unread=true — only unread
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const filter = req.query.unread === 'true' ? { read: false } : {};
    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/unread-count
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await ActivityLog.countDocuments({ read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/activity/mark-read — mark all as read
router.patch('/mark-read', async (req, res, next) => {
  try {
    await ActivityLog.updateMany({ read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
