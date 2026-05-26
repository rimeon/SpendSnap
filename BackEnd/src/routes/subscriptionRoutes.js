const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSubscriptions)
  .post(protect, addSubscription);

router.route('/:id')
  .put(protect, updateSubscription)
  .delete(protect, deleteSubscription);

module.exports = router;
