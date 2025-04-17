const express = require('express');
const router = express.Router();
const shopDashboardController = require('../controllers/shopDashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/:shopId/recent-orders', authMiddleware, shopDashboardController.getRecentOrders);
router.get('/:shopId/monthly-revenue', authMiddleware, shopDashboardController.getMonthlyRevenue);
router.get('/:shopId/daily-revenue', authMiddleware, shopDashboardController.getDailyRevenue);

module.exports = router;