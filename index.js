const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://hrms-frontend-fawn.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.) only in dev
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ─── RATE LIMITING ─────────────────────────────────────────────────────────────
// Global limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests from this IP. Please slow down and try again in 15 minutes.'
  }
});

// Stricter limiter for write operations — 30 per 15 minutes per IP
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many write requests. Please slow down and try again in 15 minutes.'
  }
});

app.use(globalLimiter);

// ─── ROOT HEALTH CHECK ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({ message: 'HRMS Backend is running 🚀', status: 'success' });
});

// ─── DATABASE ──────────────────────────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ─── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/employees', writeLimiter, require('./routes/employeeRoutes'));
app.use('/api/attendance', writeLimiter, require('./routes/attendanceRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));

// ─── 404 HANDLER ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 404, message: `Route '${req.method} ${req.path}' not found.` });
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);

  // CORS errors
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ status: 403, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    status < 500
      ? err.message || 'Bad request.'
      : 'An unexpected server error occurred. Please try again later.';

  res.status(status).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { detail: err.message })
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
