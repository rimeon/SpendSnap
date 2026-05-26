const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { convertCurrency } = require('../utils/currencyConverter');

/**
 * Aggregates a user's subscription data into analytics metrics.
 * Each subscription is processed defensively — a corrupt or invalid
 * entry will be skipped rather than crashing the whole endpoint.
 *
 * @param {string} userId — MongoDB ObjectId of the requesting user
 */
const getAggregatedData = async (userId) => {
  const user = await User.findById(userId).select('preferredCurrency');
  const preferredCurrency = user?.preferredCurrency || 'INR';

  const subscriptions = await Subscription.find({ userId });

  // ─── Helper: safe monthly cost conversion ─────────────────────────────────
  const safeMonthlyAmount = (sub) => {
    try {
      const monthly = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount;
      const converted = convertCurrency(monthly, sub.currency || 'INR', preferredCurrency);
      return isFinite(converted) ? converted : 0;
    } catch {
      return 0; // Guard against unknown currencies or NaN
    }
  };

  const totalMonthlySpend = subscriptions.reduce(
    (acc, sub) => acc + safeMonthlyAmount(sub),
    0
  );

  // ─── Category Breakdown ───────────────────────────────────────────────────
  const categoryBreakdownMap = {};
  subscriptions.forEach(sub => {
    const amount = safeMonthlyAmount(sub);
    const cat = sub.category || 'Other';
    categoryBreakdownMap[cat] = (categoryBreakdownMap[cat] || 0) + amount;
  });

  const categoryBreakdown = Object.keys(categoryBreakdownMap)
    .map(cat => ({ category: cat, amount: categoryBreakdownMap[cat] }))
    .sort((a, b) => b.amount - a.amount);

  // ─── High Cost Services ───────────────────────────────────────────────────
  const highCostServices = subscriptions
    .map(sub => ({
      serviceName: sub.serviceName,
      amount: safeMonthlyAmount(sub),
      originalAmount: sub.amount,
      originalCurrency: sub.currency || 'INR',
      billingCycle: sub.billingCycle,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalSubscriptions: subscriptions.length,
    totalMonthlySpend,
    categoryBreakdown,
    highCostServices,
    preferredCurrency,
  };
};

module.exports = { getAggregatedData };

