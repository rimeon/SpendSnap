const express = require('express');
const router = express.Router();
const { getPricing, refreshPricing } = require('../controllers/pricingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:serviceName', getPricing);
router.post('/refresh/:serviceName', refreshPricing);

module.exports = router;
