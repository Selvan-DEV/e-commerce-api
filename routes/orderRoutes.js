const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/addOrUpdateProductToCart', orderController.addProductToCart);
router.get('/cartItems/:cartItemId', orderController.getAllCartItemsBySessionId);
router.put('/updateCartItem', orderController.updateCartItem);
router.delete('/deleteCartItems/:cartItemId', orderController.deleteCartItem);

router.post('/checkout-session', orderController.createCheckoutSession);
router.get('/checkout-session/:checkoutSessionId', orderController.getCheckoutSessionById);
router.post('/:userId/createOrder', orderController.createOrder);
router.get('/:userId/getOrdersByUserId', orderController.getOrdersByUserId);
router.get('/:orderId', orderController.getOrderByOrderId);

module.exports = router;