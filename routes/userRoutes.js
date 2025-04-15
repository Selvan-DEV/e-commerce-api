const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

router.get('/:userId', authMiddleware, userController.getUser);
router.put('/:userId', authMiddleware, userController.updateUser);
router.delete('/:userId', userController.deleteUser);

router.get('/:userId/addresses', authMiddleware, userController.getUserAddresses);
router.get('/:userId/activeAddress', authMiddleware, userController.getActiveAddressByUserId);
router.post('/:userId/address', authMiddleware, userController.addUserAddress);
router.put('/address/:addressId', authMiddleware, userController.updateUserAddress);
router.delete('/address/:addressId', authMiddleware, userController.deleteUserAddress);

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);

/** Coupons */
router.post('/validate-coupon', userController.validateCoupon);
/** End */


module.exports = router;
