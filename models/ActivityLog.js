const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['employee_created', 'employee_deleted', 'attendance_marked']
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    default: 'Admin'
  },
  entityId: {
    type: String
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
