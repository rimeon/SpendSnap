/**
 * src/controllers/budgetController.js — Budget Controller
 *
 * Handles HTTP request/response for budget endpoints.
 * Delegates all DB work to budgetService.
 *
 * BUG FIX: updateBudget now validates that budgetLimit is a finite,
 * non-negative number — previously a negative or NaN value would be
 * saved to the DB (the schema min validator was bypassed by the controller).
 */
const budgetService = require('../services/budgetService');
const { logEvent } = require('../utils/auditLogger');

// ─── GET /api/budget ──────────────────────────────────────────────────────────
// @desc   Get the authenticated user's current monthly budget limit & category budgets
// @access Private
const getBudget = async (req, res, next) => {
  try {
    const budgetData = await budgetService.getBudgetByUserId(req.user._id);

    res.status(200).json({
      success: true,
      data:    budgetData,
      message: 'Budget fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/budget ──────────────────────────────────────────────────────────
// @desc   Update the authenticated user's monthly budget limit & category budgets
// @access Private
const updateBudget = async (req, res, next) => {
  try {
    const { budgetLimit, categoryBudgets } = req.body;
    const updateData = {};

    if (budgetLimit !== undefined && budgetLimit !== null) {
      const parsed = Number(budgetLimit);
      if (!isFinite(parsed) || parsed < 0) {
        res.status(400);
        throw new Error('budgetLimit must be a non-negative number');
      }
      updateData.budgetLimit = parsed;
    }

    if (categoryBudgets !== undefined) {
      if (!Array.isArray(categoryBudgets)) {
        res.status(400);
        throw new Error('categoryBudgets must be an array');
      }
      for (const cb of categoryBudgets) {
        if (!cb.category || typeof cb.category !== 'string' || !cb.category.trim()) {
          res.status(400);
          throw new Error('Each category budget must have a valid category');
        }
        if (cb.limit === undefined || cb.limit === null || isNaN(cb.limit) || Number(cb.limit) < 0) {
          res.status(400);
          throw new Error(`Budget limit for category "${cb.category}" must be a non-negative number`);
        }
      }
      updateData.categoryBudgets = categoryBudgets.map(cb => ({
        category: cb.category.trim(),
        limit: Number(cb.limit)
      }));
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400);
      throw new Error('Please provide budgetLimit or categoryBudgets to update');
    }

    const updatedData = await budgetService.updateBudgetByUserId(req.user._id, updateData);

    logEvent({
      userId: req.user._id,
      action: 'BUDGET_UPDATED',
      category: 'BUDGET',
      req,
      metadata: {
        budgetLimit: updatedData.budgetLimit,
        categoryBudgetsCount: updatedData.categoryBudgets?.length || 0,
      },
    });

    res.status(200).json({
      success: true,
      data:    updatedData,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudget, updateBudget };
