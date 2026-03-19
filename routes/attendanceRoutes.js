const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

// ─── Helper: check validation result ─────────────────────────────────────────
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields = {};
    errors.array().forEach(e => { fields[e.path] = e.msg; });
    res.status(400).json({
      status: 400,
      message: 'Validation failed. Please correct the highlighted fields.',
      fields
    });
    return false;
  }
  return true;
};

// ─── Validation rules ─────────────────────────────────────────────────────────
const attendanceValidators = [
  body('employeeId')
    .trim()
    .notEmpty().withMessage('Employee ID is required.')
    .matches(/^[A-Za-z0-9\-]+$/).withMessage('Employee ID must only contain letters, numbers, or hyphens.'),

  body('date')
    .trim()
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD).')
    .custom(value => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // allow marking for today
      if (inputDate > today) {
        throw new Error('Date cannot be in the future.');
      }
      return true;
    }),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .isIn(['Present', 'Absent']).withMessage('Status must be either "Present" or "Absent".')
];

// ─── GET /api/attendance/date/:date ───────────────────────────────────────────
router.get('/date/:date',
  param('date')
    .trim()
    .isISO8601().withMessage('Invalid date format.'),
  async (req, res, next) => {
    if (!checkValidation(req, res)) return;
    try {
      const { date } = req.params;
      const [year, month, day] = date.split('-').map(Number);
      const searchDate = new Date(Date.UTC(year, month - 1, day));

      const records = await Attendance.find({ date: searchDate });
      res.json(records);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/attendance/:employeeId ─────────────────────────────────────────
router.get('/:employeeId',
  param('employeeId')
    .trim()
    .matches(/^[A-Za-z0-9\-]+$/).withMessage('Invalid employee ID.'),
  async (req, res, next) => {
    if (!checkValidation(req, res)) return;
    try {
      const records = await Attendance.find({ employeeId: req.params.employeeId }).sort({ date: -1 });
      res.json(records);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/attendance ─────────────────────────────────────────────────────
router.post('/', attendanceValidators, async (req, res, next) => {
  if (!checkValidation(req, res)) return;
  try {
    const { employeeId, date, status } = req.body;

    const [year, month, day] = date.split('-').map(Number);
    const attendanceDate = new Date(Date.UTC(year, month - 1, day));

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date: attendanceDate },
      { $set: { status } },
      { new: true, upsert: true, runValidators: true }
    );

    // Log the activity
    await ActivityLog.create({
      action: 'attendance_marked',
      description: `Attendance marked as ${status} for employee ${employeeId} on ${date}.`,
      entityId: employeeId,
      meta: { employeeId, date, status }
    });

    res.status(201).json(record);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ status: 400, message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ status: 400, message: 'Attendance already marked for this date.' });
    }
    next(err);
  }
});

module.exports = router;
