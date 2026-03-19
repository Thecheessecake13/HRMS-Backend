const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Enter a valid email']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
