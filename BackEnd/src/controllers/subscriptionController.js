const pricingService = require('../services/pricingService');
const subscriptionService = require('../services/subscriptionService');
const User = require('../models/User');
const { logEvent } = require('../utils/auditLogger');

const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getSubscriptionsByUserId(req.user._id);
    res.status(200).json({
      success: true,
      data: subscriptions,
      message: 'Subscriptions fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

const addSubscription = async (req, res, next) => {
  try {
    const {
      serviceName,
      planName,
      amount,
      currency,
      billingCycle,
      nextBillingDate,
      manualCategory,
      manualSubcategory,
    } = req.body;

    if (!serviceName?.trim() || amount === undefined || !billingCycle || !nextBillingDate) {
      res.status(400);
      throw new Error('serviceName, amount, billingCycle and nextBillingDate are required');
    }

    if (isNaN(amount) || Number(amount) < 0) {
      res.status(400);
      throw new Error('amount must be a non-negative number');
    }

    let category = manualCategory?.trim() || null;
    let subcategory = manualSubcategory?.trim() || null;

    if (!category || !subcategory) {
      // Use pricingService to get cached category data or fetch from AI
      const pricingData = await pricingService.getPricingForService(serviceName.trim());
      category = category || pricingData.category;
      subcategory = subcategory || pricingData.subcategory;
    }

    const subscription = await subscriptionService.createSubscription(req.user._id, {
      serviceName: serviceName.trim(),
      category,
      subcategory,
      planName: planName?.trim() || '',
      amount: Number(amount),
      currency: currency || req.user.preferredCurrency || 'INR',
      billingCycle,
      nextBillingDate,
    });

    logEvent({
      userId: req.user._id,
      action: 'SUBSCRIPTION_CREATED',
      category: 'SUBSCRIPTION',
      req,
      metadata: {
        subscriptionId: subscription._id,
        serviceName: subscription.serviceName,
        amount: subscription.amount,
        currency: subscription.currency,
      },
    });

    // Invalidate AI insights cache on change
    await User.findByIdAndUpdate(req.user._id, { $unset: { insightsLastUpdated: 1 } }).catch(err => {
      console.error('Failed to invalidate insights cache:', err.message);
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription added successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const updated = await subscriptionService.updateSubscriptionById(
      req.params.id,
      req.user._id,
      req.body
    );

    logEvent({
      userId: req.user._id,
      action: 'SUBSCRIPTION_UPDATED',
      category: 'SUBSCRIPTION',
      req,
      metadata: {
        subscriptionId: updated._id,
        serviceName: updated.serviceName,
        updatedFields: Object.keys(req.body),
      },
    });

    // Invalidate AI insights cache on change
    await User.findByIdAndUpdate(req.user._id, { $unset: { insightsLastUpdated: 1 } }).catch(err => {
      console.error('Failed to invalidate insights cache:', err.message);
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    if (error.message === 'Subscription not found') res.status(404);
    else if (error.message === 'User not authorized') res.status(403);
    next(error);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    await subscriptionService.deleteSubscriptionById(req.params.id, req.user._id);

    logEvent({
      userId: req.user._id,
      action: 'SUBSCRIPTION_DELETED',
      category: 'SUBSCRIPTION',
      req,
      metadata: {
        subscriptionId: req.params.id,
      },
    });

    // Invalidate AI insights cache on change
    await User.findByIdAndUpdate(req.user._id, { $unset: { insightsLastUpdated: 1 } }).catch(err => {
      console.error('Failed to invalidate insights cache:', err.message);
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    if (error.message === 'Subscription not found') res.status(404);
    else if (error.message === 'User not authorized') res.status(403);
    next(error);
  }
};

module.exports = { getSubscriptions, addSubscription, updateSubscription, deleteSubscription };
