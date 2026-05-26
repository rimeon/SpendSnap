const pricingService = require('../services/pricingService');

const getPricing = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    if (!serviceName) {
      res.status(400);
      throw new Error('Service name is required');
    }

    const pricingInfo = await pricingService.getPricingForService(serviceName);

    res.status(200).json({
      success: true,
      data: pricingInfo,
      message: 'Pricing info fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

const refreshPricing = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    if (!serviceName) {
      res.status(400);
      throw new Error('Service name is required');
    }

    const newPricingInfo = await pricingService.refreshPricingCache(serviceName);

    res.status(200).json({
      success: true,
      data: newPricingInfo,
      message: 'Pricing info refreshed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPricing, refreshPricing };
