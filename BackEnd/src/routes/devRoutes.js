/**
 * src/routes/devRoutes.js — Developer and Demo Seeding Routes
 *
 * Exposes endpoints to quickly reset and seed realistic demo data.
 * Ideal for portfolio demonstrations, enabling recruiters to populate
 * the dashboard with single-click visual mockups without tedious forms.
 */
const express      = require('express');
const router       = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const Subscription = require('../models/Subscription');
const Budget       = require('../models/Budget');
const User         = require('../models/User');
const { logEvent } = require('../utils/auditLogger');

// POST /api/dev/seed
// Access: Private (Seeding is isolated to the authenticated user's session)
// GUARD:  Development/demo environments only — returns 404 in production so
//         the route appears non-existent to any attacker probing the API.
router.post('/seed', protect, async (req, res, next) => {
  // ── Production guard ────────────────────────────────────────────────────────
  // This endpoint deletes and replaces all of a user's subscription data.
  // It must NEVER be reachable in a production environment.
  // Returns 404 (not 403) so the route is invisible — not just forbidden.
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  try {
    const userId = req.user._id;
    const currency = req.user.preferredCurrency || 'INR';

    // 1. Purge all existing subscriptions and budget for this user
    await Subscription.deleteMany({ userId });
    await Budget.findOneAndDelete({ userId });

    // 2. Determine seeding values based on user's preferred currency
    const isUSD = ['USD', 'EUR', 'GBP'].includes(currency.toUpperCase());

    const rawSeedData = [
      { name: 'Netflix', plan: 'Premium 4K', inr: 649, usd: 15.49, cat: 'Entertainment', subcat: 'Streaming', cycle: 'monthly', offsetDays: 12 },
      { name: 'Spotify', plan: 'Premium Individual', inr: 119, usd: 10.99, cat: 'Entertainment', subcat: 'Music', cycle: 'monthly', offsetDays: 5 },
      { name: 'GitHub Copilot', plan: 'Individual', inr: 820, usd: 10.00, cat: 'Developer Tools', subcat: 'Cloud', cycle: 'monthly', offsetDays: 22 },
      { name: 'Notion', plan: 'Plus Plan', inr: 4800, usd: 96.00, cat: 'Productivity', subcat: 'Tools', cycle: 'yearly', offsetDays: 120 },
      { name: 'Google One', plan: '100GB Storage', inr: 130, usd: 1.99, cat: 'Productivity', subcat: 'Cloud Storage', cycle: 'monthly', offsetDays: 2 },
      { name: 'Coursera', plan: 'Plus Annual', inr: 32000, usd: 399.00, cat: 'Education', subcat: 'Learning', cycle: 'yearly', offsetDays: 280 }
    ];

    // Helper to calculate future billing dates relative to today
    const getFutureDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    const subscriptionsToInsert = rawSeedData.map(sub => ({
      userId,
      serviceName: sub.name,
      planName: sub.plan,
      amount: isUSD ? sub.usd : sub.inr,
      currency,
      billingCycle: sub.cycle,
      nextBillingDate: getFutureDate(sub.offsetDays),
      category: sub.cat,
      subcategory: sub.subcat,
    }));

    await Subscription.insertMany(subscriptionsToInsert);

    // 3. Create a realistic budget limit and breakdown matching currency range
    const totalBudget = isUSD ? 200 : 8000;
    const categoryLimits = isUSD
      ? [
          { category: 'Entertainment', limit: 40 },
          { category: 'Productivity', limit: 50 },
          { category: 'Developer Tools', limit: 30 },
          { category: 'Education', limit: 80 }
        ]
      : [
          { category: 'Entertainment', limit: 1500 },
          { category: 'Productivity', limit: 2000 },
          { category: 'Developer Tools', limit: 1500 },
          { category: 'Education', limit: 3000 }
        ];

    await Budget.create({
      userId,
      budgetLimit: totalBudget,
      categoryBudgets: categoryLimits,
    });

    // 4. Populate pre-calculated insights so charts look full without calling Gemini API
    const formattedTotalSpend = isUSD ? `$${(50.47).toFixed(2)}` : `₹${(3318).toLocaleString('en-IN')}`;
    const formattedCopilotVal = isUSD ? '$10.00' : '₹820.00';
    const formattedCourseraVal = isUSD ? '$399.00' : '₹32,000.00';

    const seedInsights = [
      `Your total monthly spend is ${formattedTotalSpend}/month (Netflix, Spotify, Copilot, Google One, and prorated Notion/Coursera).`,
      `Productivity & Developer Tools represent roughly 62% of your monthly subscription expenditure.`,
      `GitHub Copilot (${formattedCopilotVal}/mo) and Coursera (${formattedCourseraVal}/yr) are your highest technical investments.`,
    ];

    await User.findByIdAndUpdate(userId, {
      cachedInsights: seedInsights,
      insightsLastUpdated: new Date(),
    });

    // 5. Save system event to audit log
    await logEvent({
      userId,
      action: 'DEMO_DATA_SEEDED',
      category: 'SYSTEM',
      req,
      metadata: {
        subscriptionsCount: subscriptionsToInsert.length,
        currency,
      },
    });

    res.status(200).json({
      success: true,
      message: `Demo data reloaded in ${currency}! 6 subscriptions, budgets, and visual insights are ready.`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
