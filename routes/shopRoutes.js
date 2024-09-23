const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/:shopId/products', authMiddleware, shopController.getProductsbyShopId);
router.post('/:shopId/create-product', authMiddleware, shopController.addProduct);
router.get('/:shopId/categories', authMiddleware, shopController.getCategoriesByShopId);
router.get('/:shopId/orders', authMiddleware, shopController.getOrdersByShopId);
router.get('/:shopId/orders/:orderId', authMiddleware, shopController.getOrderItemsByOrderId);
router.put('/:shopId/orders/updateOrderStatus', authMiddleware, shopController.updateOrderStatus);

// Common Shop related API's
router.get('/orderStatuses', shopController.getOrderStatuses);

module.exports = router;