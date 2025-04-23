const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middlewares/authMiddleware');

/** Dashboard API's */
router.get('/:shopId/dashboard/summary-cards', authMiddleware, shopController.getDashboardSummaryCards);
/** End */

/** Customers API's */
router.get('/:shopId/customers', authMiddleware, shopController.getCustomers);
/** End */

/** Products API's */
router.get('/:shopId/products', authMiddleware, shopController.getProductsbyShopId);
router.get('/:shopId/products/:productId', authMiddleware, shopController.getProductByShopIdAndProductId);
router.post('/:shopId/create-product', authMiddleware, shopController.addProduct);
router.put('/:shopId/update-product', authMiddleware, shopController.updateProduct);
router.get('/:shopId/categories', authMiddleware, shopController.getCategoriesByShopId);
router.put('/:shopId/product-action', authMiddleware, shopController.productAction);
/** End */

/** Orders API's */
router.get('/:shopId/orders', authMiddleware, shopController.getOrdersByShopId);
router.get('/:shopId/orders/:orderId', authMiddleware, shopController.getOrderItemsByOrderId);
router.put('/:shopId/orders/updateOrderStatus', authMiddleware, shopController.updateOrderStatus);
/** End */

/** Coupons Management */
router.get('/:shopId/coupons', authMiddleware, shopController.getAllCoupons);
router.get('/:shopId/coupons/:couponId', authMiddleware, shopController.getCouponById);
router.post('/:shopId/coupons', authMiddleware, shopController.createCoupon);
router.put('/:shopId/coupons/:couponId/update', authMiddleware, shopController.updateCoupon);
router.put('/:shopId/coupons/:couponId/update-status', authMiddleware, shopController.updateCouponStatus);
/** End */

/** Reviews API's */
router.get('/:shopId/reviews', shopController.getAllReviews);
router.put('/:shopId/reviews/:reviewId/update-status', authMiddleware, shopController.updateReviewStatus);
/** End */

/** Shop Related Common API's  */
router.get('/orderStatuses', shopController.getOrderStatuses);
/** End */

module.exports = router;