const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payementController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create-payment-method', authMiddleware, paymentController.createPaymentMethod);
router.get('/:userId/getCards', authMiddleware, paymentController.getCardsListByUserId);
router.delete('/:paymentMethodId/deleteCard', authMiddleware, paymentController.deletePaymentMethod);
router.post('/createPaymentIntent', authMiddleware, paymentController.createPaymentIntent);

module.exports = router;