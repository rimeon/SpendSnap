/**
 * src/services/budgetService.js — Budget Business Logic
 *
 * Encapsulates all database operations related to a user's budget limit.
 * Controllers call these functions and never touch Mongoose directly.
 *
 * BUG FIX: updateBudgetLimitByUserId now handles the case where the user
 * BUG FIX: updateBudgetByUserId now handles the case where the user
 * document is not found (e.g. account deleted after token was issued) by
 * throwing a descriptive error instead of crashing with a TypeError.
 */
const User = require('../models/User');

/**
 * Get the budget details (overall budgetLimit and categoryBudgets) for a user.
 *
 * @param {string} userId — MongoDB ObjectId of the user
 * @returns {Promise<object>} Budget limit and category budgets
 */
const getBudgetByUserId = async (userId) => {
  const user = await User.findById(userId).select('budgetLimit categoryBudgets');
  return {
    budgetLimit: user ? user.budgetLimit : 0,
    categoryBudgets: user?.categoryBudgets || [],
  };
};

/**
 * Update the budget details for a user.
 *
 * @param {string} userId — MongoDB ObjectId of the user
 * @param {object} updateData — Object containing budgetLimit and/or categoryBudgets
 * @returns {Promise<object>} Updated budget details
 */
const updateBudgetByUserId = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('budgetLimit categoryBudgets');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    budgetLimit: user.budgetLimit,
    categoryBudgets: user.categoryBudgets || [],
  };
};

module.exports = {
  getBudgetByUserId,
  updateBudgetByUserId,
};
