const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/categories', productController.getCategoriesAndProducts);
router.get('/', productController.getProductList);
router.get('/popular-products', productController.getPopularProducts);
router.get('/top-sale-products', productController.getTopSaleProducts);
router.get('/:productName', productController.getProductDetail);
router.post('/', productController.addProduct);
router.delete('/:id', productController.deleteProduct);

// Reviews
router.post('/review', productController.createReview);
router.get('/:productId/reviews', productController.getReviewsByProductId);


module.exports = router;
