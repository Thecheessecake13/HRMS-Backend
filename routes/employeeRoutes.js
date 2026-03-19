const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');

// ─── Allowed departments (single source of truth) ────────────────────────────
const DEPARTMENTS = [
  'Engineering', 'Human Resources', 'Marketing',
  'Sales', 'Design', 'Finance', 'Operations'
];

// ─── Validation rules ────────────────────────────────────────────────────────
const employeeValidators = [
  body('employeeId')
    .trim()
    .notEmpty().withMessage('Employee ID is required.')
    .matches(/^[A-Za-z0-9\-]+$/).withMessage('Employee ID must only contain letters, numbers, or hyphens.')
    .isLength({ max: 20 }).withMessage('Employee ID must be 20 characters or fewer.'),

  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Name is required.')
    .matches(/^[A-Za-z\s]+$/).withMessage('Name must only contain letters and spaces.')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters.'),

  body('email')
    .trim()
    .normalizeEmail()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .isLength({ max: 100 }).withMessage('Email must be 100 characters or fewer.'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required.')
    .isIn(DEPARTMENTS).withMessage(`Department must be one of: ${DEPARTMENTS.join(', ')}.`)
];

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

// ─── GET /api/employees ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/employees ──────────────────────────────────────────────────────
router.post('/', employeeValidators, async (req, res, next) => {
  if (!checkValidation(req, res)) return;
  try {
    const { employeeId, name, email, department } = req.body;

    const existingById = await Employee.findOne({ employeeId });
    if (existingById) {
      return res.status(400).json({ status: 400, message: 'An employee with this ID already exists.' });
    }
    const existingByEmail = await Employee.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ status: 400, message: 'This email address is already in use.' });
    }

    const employee = new Employee({ employeeId, name, email, department });
    await employee.save();

    // Log the activity
    await ActivityLog.create({
      action: 'employee_created',
      description: `Employee ${name} (${employeeId}) was added to ${department}.`,
      entityId: employeeId,
      meta: { name, email, department, mongoId: employee._id }
    });

    res.status(201).json(employee);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ status: 400, message: err.message });
    }
    next(err);
  }
});

// ─── DELETE /api/employees/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ status: 404, message: 'Employee not found.' });
    }

    // Log the activity
    await ActivityLog.create({
      action: 'employee_deleted',
      description: `Employee ${employee.name} (${employee.employeeId}) was removed from ${employee.department}.`,
      entityId: employee.employeeId,
      meta: { name: employee.name, email: employee.email, department: employee.department }
    });

    res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ status: 400, message: 'Invalid employee ID format.' });
    }
    next(err);
  }
});

// ─── PUT /api/employees/:id ───────────────────────────────────────────────────
router.put('/:id', employeeValidators, async (req, res, next) => {
  if (!checkValidation(req, res)) return;
  try {
    const { employeeId, name, email, department } = req.body;
    
    // Check conflicts
    const existingById = await Employee.findOne({ employeeId, _id: { $ne: req.params.id } });
    if (existingById) {
      return res.status(400).json({ status: 400, message: 'An employee with this ID already exists.' });
    }
    const existingByEmail = await Employee.findOne({ email, _id: { $ne: req.params.id } });
    if (existingByEmail) {
      return res.status(400).json({ status: 400, message: 'This email address is already in use.' });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { employeeId, name, email, department },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ status: 404, message: 'Employee not found.' });
    }

    // Log activity
    await ActivityLog.create({
      action: 'employee_created', // re-use this enum since we didn't define employee_updated
      description: `Employee ${name} (${employeeId}) details were updated.`,
      entityId: employeeId,
      meta: { name, email, department }
    });

    res.json(employee);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ status: 400, message: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ status: 400, message: 'Invalid employee ID format.' });
    }
    next(err);
  }
});

module.exports = router;
