const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
// Helmet sets secure HTTP headers (CSP, X-Frame-Options, etc.)
// In production, relax CSP slightly to allow the built React app to load assets.
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
    },
  } : false,
}));

// CORS — allows localhost (same machine) and any private LAN IP range.
// For clinic LAN: set CORS_ORIGIN in server/.env to the server PC's LAN IP.
// Default: 192.168.1.10 (configurable via CORS_ORIGIN).
// Backup IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) are auto-allowed.
const allowedOrigins = new Set([
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:5174',                        // Vite alternate port
  'http://192.168.1.10:5000',                     // Default clinic LAN IP
  'http://192.168.1.10:5173',                     // Dev fallback same IP
  'http://192.168.1.11:5000',                     // Backup IP #1
  'http://192.168.1.12:5000',                     // Backup IP #2
  'http://192.168.0.10:5000',                     // Backup subnet A
  'http://10.0.0.10:5000',                        // Backup subnet B (10.x)
  process.env.CORS_ORIGIN,                        // Primary LAN IP from .env
].filter(Boolean));

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no Origin header (same-machine curl, Postman, etc.)
    if (!origin) return cb(null, true);

    // Allow localhost on any port
    if (origin.startsWith('http://localhost:')) return cb(null, true);

    // Auto-allow all RFC-1918 private network ranges
    if (
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.')      ||
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\./.test(origin)
    ) {
      return cb(null, true);
    }

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

// ─── API ROUTES ───────────────────────────────────────────────
app.use('/api/auth',            authLimiter, require('./routes/auth'));
app.use('/api/patients',        require('./routes/patients'));
app.use('/api/staff',           require('./routes/staff'));
app.use('/api/doctors',         require('./routes/doctors'));
app.use('/api/appointments',    require('./routes/appointments'));
app.use('/api/queue',           require('./routes/queue'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/consultations',   require('./routes/consultations'));
app.use('/api/sms',             require('./routes/sms'));
app.use('/api/dashboard',       require('./routes/dashboard'));
app.use('/api/reports',         require('./routes/reports'));
app.use('/api/audit-logs',      require('./routes/audit'));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'LikhaHealth API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── STATIC FRONTEND (PRODUCTION) ─────────────────────────────
// In production, Express serves the Vite-built React app from /public.
// The SPA catch-all ensures client-side routes (React Router) return index.html.
// In development, Vite's dev server handles the frontend on port 5173.
if (isProd) {
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  // SPA catch-all: any non-API GET request returns the React index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// ─── 404 HANDLER (API only in prod; dev catches all) ──────────
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
app.listen(PORT, '0.0.0.0', () => {
  const mode = isProd ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║       LikhaHealth Server — ${mode.padEnd(11)}║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Local:   http://localhost:${PORT}           ║`);
  console.log(`║  Network: http://192.168.1.10:${PORT}        ║`);
  console.log(`║  Health:  http://localhost:${PORT}/api/health║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  // Start background scheduled jobs (data retention, SMS reminders)
  const { startScheduledJobs } = require('./jobs/scheduledJobs');
  startScheduledJobs();
});

