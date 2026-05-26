const express = require('express');
const router = express.Router();
const { getBudget, updateBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getBudget)
  .put(protect, updateBudget);

module.exports = router;
