const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes         = require('./routes/authRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const budgetRoutes       = require('./routes/budgetRoutes');
const pricingRoutes      = require('./routes/pricingRoutes');
const analyticsRoutes    = require('./routes/analyticsRoutes');
const aiRoutes           = require('./routes/aiRoutes');
const devRoutes          = require('./routes/devRoutes');

// ─── Import scheduled jobs (registers cron on startup) ───────────────────────
require('./jobs/billingDateUpdater');

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
// CORS: allow credentials (cookies) from the React dev server.
// credentials:true REQUIRES an explicit origin — wildcard '*' is rejected by browsers.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse cookies — required for reading the httpOnly auth token cookie
app.use(cookieParser());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/budget',        budgetRoutes);
app.use('/api/pricing',       pricingRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/dev',           devRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Simple endpoint to verify the server is alive (useful for monitoring)
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'Server is healthy ✅' })
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes so it catches errors forwarded via next(err)
app.use(errorHandler);

module.exports = app;
