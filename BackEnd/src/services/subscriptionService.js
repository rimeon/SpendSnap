/**
 * src/services/subscriptionService.js — Subscription Business Logic
 *
 * Encapsulates all database operations related to subscriptions.
 * Controllers call these functions and never touch Mongoose directly.
 */
const Subscription = require('../models/Subscription');

/**
 * Fetch all subscriptions belonging to a user, newest first.
 *
 * @param {string} userId — MongoDB ObjectId of the owner
 * @returns {Promise<Subscription[]>}
 */
const getSubscriptionsByUserId = (userId) =>
  Subscription.find({ userId }).sort({ createdAt: -1 });

/**
 * Create a new subscription document.
 *
 * @param {string} userId — Owner's ObjectId
 * @param {object} data   — Subscription fields (serviceName, amount, etc.)
 * @returns {Promise<Subscription>}
 */
const createSubscription = (userId, data) =>
  Subscription.create({ userId, ...data });

/**
 * Update a subscription after verifying ownership.
 *
 * BUG FIX: The update payload is whitelisted to prevent a malicious client
 * from overwriting `userId` and "stealing" a subscription.
 *
 * @param {string} subscriptionId — ID of the subscription to update
 * @param {string} userId         — ID of the requesting user (ownership check)
 * @param {object} data           — Fields to update
 * @returns {Promise<Subscription>} Updated document
 */
const updateSubscriptionById = async (subscriptionId, userId, data) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Prevent one user from modifying another user's subscription
  if (subscription.userId.toString() !== userId.toString()) {
    throw new Error('User not authorized');
  }

  // Whitelist updatable fields — never allow userId to be overwritten
  const { serviceName, planName, amount, currency, billingCycle, nextBillingDate, category, subcategory } = data;
  const allowedUpdates = { serviceName, planName, amount, currency, billingCycle, nextBillingDate, category, subcategory };

  // Remove undefined keys so Mongoose doesn't overwrite fields with undefined
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  return Subscription.findByIdAndUpdate(
    subscriptionId,
    allowedUpdates,
    { new: true, runValidators: true }  // Return the updated doc and re-run schema validators
  );
};

/**
 * Delete a subscription after verifying ownership.
 *
 * @param {string} subscriptionId — ID of the subscription to delete
 * @param {string} userId         — ID of the requesting user (ownership check)
 * @returns {Promise<void>}
 */
const deleteSubscriptionById = async (subscriptionId, userId) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (subscription.userId.toString() !== userId.toString()) {
    throw new Error('User not authorized');
  }

  await subscription.deleteOne();
};

module.exports = {
  getSubscriptionsByUserId,
  createSubscription,
  updateSubscriptionById,
  deleteSubscriptionById,
};
