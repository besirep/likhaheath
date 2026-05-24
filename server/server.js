const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
// Helmet sets secure HTTP headers (CSP, X-Frame-Options, etc.)
app.use(helmet());

// CORS — allows both localhost (for the server PC itself) and the
// configured LAN IP (for other workstations on the network).
// Set CORS_ORIGIN in server/.env to the server PC's LAN IP.
// Example: CORS_ORIGIN=http://192.168.1.10:5173
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',                        // Vite alternate port
  process.env.CORS_ORIGIN,                        // LAN IP from .env
].filter(Boolean));

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no Origin header (same-machine Postman, curl, etc.)
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── RATE LIMITING ────────────────────────────────────────────
// Brute-force protection on auth — 10 attempts per IP per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',            authLimiter, require('./routes/auth'));
app.use('/api/patients',        require('./routes/patients'));
app.use('/api/staff',           require('./routes/staff'));
app.use('/api/doctors',         require('./routes/doctors'));      // FIX: was never mounted
app.use('/api/appointments',    require('./routes/appointments'));
app.use('/api/queue',           require('./routes/queue'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/consultations',   require('./routes/consultations'));
app.use('/api/sms',             require('./routes/sms'));
app.use('/api/dashboard',       require('./routes/dashboard'));
app.use('/api/reports',         require('./routes/reports'));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'LikhaHealth API is running.', version: '1.0.0' });
});

// ─── 404 HANDLER ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── ERROR HANDLER ────────────────────────────────────────────
// SECURITY: log full error server-side; never expose internals to client
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// ─── START ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LikhaHealth server running on http://localhost:${PORT}`);

  // Start background scheduled jobs (data retention, SMS reminders)
  const { startScheduledJobs } = require('./jobs/scheduledJobs');
  startScheduledJobs();
});
