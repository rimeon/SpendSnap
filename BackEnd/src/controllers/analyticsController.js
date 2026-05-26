const { getAggregatedData } = require('../aggregations/analyticsAggregations');
const { generateInsights } = require('../services/aiService');
const User = require('../models/User');

const getAnalytics = async (req, res, next) => {
  try {
    const aggregatedData = await getAggregatedData(req.user._id);
    const user = await User.findById(req.user._id);

    const cacheAgeMs = user.insightsLastUpdated
      ? Date.now() - new Date(user.insightsLastUpdated).getTime()
      : Infinity;

    const isCacheStale = cacheAgeMs > 24 * 60 * 60 * 1000; // 24 hours

    if (isCacheStale && aggregatedData.totalSubscriptions > 0) {
      // Trigger background update asynchronously
      generateInsights(aggregatedData)
        .then(async (newInsights) => {
          if (Array.isArray(newInsights) && newInsights.length > 0) {
            await User.findByIdAndUpdate(req.user._id, {
              cachedInsights: newInsights,
              insightsLastUpdated: new Date()
            });
            console.log(`✅ Background insights updated for user: ${req.user._id}`);
          }
        })
        .catch((err) => {
          console.error(`❌ Background insights failed for user: ${req.user._id}`, err.message);
        });
    }

    res.status(200).json({
      success: true,
      data: {
        ...aggregatedData,
        insights: user.cachedInsights || []
      },
      message: 'Analytics fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
