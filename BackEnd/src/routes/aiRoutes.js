const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const { protect }     = require('../middleware/authMiddleware');
const aiProvider      = require('../services/aiProvider');
const { parseInvoice }= require('../services/aiService'); // direct for file uploads
const { getAggregatedData } = require('../aggregations/analyticsAggregations');
const User = require('../models/User');

router.use(protect);

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// 5 AI requests per user per hour — prevents API cost abuse in demos
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.user._id.toString(), // per-user, not per-IP
  message: {
    success: false,
    message: 'AI rate limit reached. You can make 5 AI requests per hour. Please wait before retrying.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all /api/ai/* routes
router.use(aiLimiter);

// ─── POST /api/ai/categorize ──────────────────────────────────────────────────
// Classify a service name → { category, subcategory }
// Routes through aiProvider: Gemini primary, rule-based fallback
router.post('/categorize', async (req, res) => {
  try {
    const { serviceName } = req.body;
    if (!serviceName) return res.status(400).json({ success: false, message: 'serviceName is required' });

    const result = await aiProvider.categorize(serviceName.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/ai/parse-invoice ───────────────────────────────────────────────
// Parse a base64-encoded invoice file (PDF/image) → subscription fields
router.post('/parse-invoice', async (req, res) => {
  try {
    const { fileData, mimeType } = req.body;

    // Input validation — prevent oversized payloads and invalid types
    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!fileData || !mimeType) {
      return res.status(400).json({ success: false, message: 'fileData and mimeType are required' });
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ success: false, message: `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` });
    }
    // Base64: ~1.33x original size. 5MB file → ~6.67MB base64
    const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // 7MB
    if (fileData.length > MAX_BASE64_LENGTH) {
      return res.status(400).json({ success: false, message: 'File too large. Maximum 5MB.' });
    }

    const result = await aiProvider.parseInvoiceFile(fileData, mimeType);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/ai/parse-email ─────────────────────────────────────────────────
// Email ingestion simulation: paste raw email text → subscription fields
// Gemini primary, regex-based fallback — works 100% offline
router.post('/parse-email', async (req, res) => {
  try {
    const { emailText } = req.body;
    if (!emailText || typeof emailText !== 'string') {
      return res.status(400).json({ success: false, message: 'emailText (string) is required' });
    }
    if (emailText.length > 20000) {
      return res.status(400).json({ success: false, message: 'Email text too long (max 20,000 characters)' });
    }

    const result = await aiProvider.parseEmailText(emailText);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/ai/insights ────────────────────────────────────────────────────
// Generate/refresh AI-powered financial insights for the current user
router.post('/insights', async (req, res) => {
  try {
    const aggregatedData = await getAggregatedData(req.user._id);
    const newInsights    = await aiProvider.generateInsights(aggregatedData);

    if (Array.isArray(newInsights) && newInsights.length > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        cachedInsights:      newInsights,
        insightsLastUpdated: new Date(),
      });
    }

    res.json({ success: true, data: newInsights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
