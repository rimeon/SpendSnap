const PricingCache = require('../models/PricingCache');
const { fetchPricingFromAI, categorizeSubscription } = require('./aiService');

const getPricingForService = async (serviceName) => {
  const normalizedName = serviceName.trim().toLowerCase();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // BUG FIX: Removed the pre-check findOne that created a race condition.
  // Two concurrent requests for the same service would both miss the cache
  // simultaneously, each triggering a separate Gemini API call (2x token waste).
  // Going directly to findOneAndUpdate is atomic — the DB resolves the race.
  // Only fetch from AI if the cache is empty or stale (older than 7 days).
  const existing = await PricingCache.findOne({ serviceName: normalizedName });

  if (existing && existing.lastUpdated > sevenDaysAgo) {
    return existing; // Fresh cache hit — return immediately
  }

  // Cache miss or stale — fetch fresh data from AI
  const availablePlans = await fetchPricingFromAI(normalizedName);

  // Reuse existing category if we have it; only call AI if genuinely new entry
  let category = existing?.category || 'Other';
  let subcategory = existing?.subcategory || 'Other';
  if (!existing) {
    const catResult = await categorizeSubscription(normalizedName);
    category = catResult.category;
    subcategory = catResult.subcategory;
  }

  // Atomic upsert — safe under concurrent requests
  const cached = await PricingCache.findOneAndUpdate(
    { serviceName: normalizedName },
    { serviceName: normalizedName, category, subcategory, availablePlans, lastUpdated: new Date(), source: 'ai' },
    { new: true, upsert: true }
  );

  return cached;
};

const refreshPricingCache = async (serviceName) => {
  const normalizedName = serviceName.trim().toLowerCase();
  
  const availablePlans = await fetchPricingFromAI(normalizedName);
  const catResult = await categorizeSubscription(normalizedName);

  const updateData = {
    serviceName: normalizedName,
    category: catResult.category,
    subcategory: catResult.subcategory,
    availablePlans,
    lastUpdated: new Date(),
    source: 'ai'
  };

  return await PricingCache.findOneAndUpdate(
    { serviceName: normalizedName },
    updateData,
    { new: true, upsert: true }
  );
};

module.exports = { getPricingForService, refreshPricingCache };
