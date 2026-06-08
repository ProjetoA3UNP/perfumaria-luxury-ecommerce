const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// POST /api/coupons/validate
router.post('/validate', couponController.validate);

module.exports = router;
