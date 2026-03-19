const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    ref: 'Employee'
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: [true, 'Status is required']
  }
}, { timestamps: true });

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
