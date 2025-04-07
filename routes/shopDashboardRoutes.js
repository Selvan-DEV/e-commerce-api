const express = require('express');
const router = express.Router();
const shopDashboardController = require('../controllers/shopDashboardController');

router.get('/:shopId/recent-orders', shopDashboardController.getRecentOrders);

module.exports = router;