const Product = require('../models/productModel');

exports.getProductList = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      priceRange: req.query.minPrice && req.query.maxPrice ? { min: req.query.minPrice, max: req.query.maxPrice } : null,
      rating: req.query.rating,
      brand: req.query.brand
    };

    const pagination = {
      limit: parseInt(req.query.limit) || 1000,
      offset: parseInt(req.query.offset) || 0
    };

    const products = await Product.getAll(filters, pagination);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.getByProductName(req.params.productName);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const product = req.body;
    const productId = await Product.addProductToCart(product);
    res.status(201).json({ id: productId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const affectedRows = await Product.deleteById(req.params.id);
    if (affectedRows > 0) {
      res.status(200).json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
