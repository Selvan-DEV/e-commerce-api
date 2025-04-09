const Product = require('../models/productModel');

exports.getProductList = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      priceRange: req.query.minPrice && req.query.maxPrice ?
        { min: req.query.minPrice, max: req.query.maxPrice } : null,
      rating: req.query.rating,
      brand: req.query.brand,
      categoryId: req.query.categoryId
    };

    const pagination = {
      limit: parseInt(req.query.limit) || 1000,
      offset: parseInt(req.query.offset) || 0
    };

    const products = await Product.getAll(filters, pagination);

    const productWithCategory = await Promise.all(products.map(async (item) => {
      const category = await Product.getCategoryById(item.categoryId);
      return {
        ...item,
        categoryName: category.categoryName ? category.categoryName : ''
      };
    }));
    res.status(200).json(productWithCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoriesAndProducts = async (_req, res) => {
  try {
    const products = await Product.getAllProducts();
    const categoryMap = new Map();

    for (const item of products) {
      // Fetch category details for each product
      const category = await Product.getCategoryById(item.categoryId);

      if (!categoryMap.has(category.categoryId)) {
        categoryMap.set(category.categoryId, {
          categoryName: category.categoryName,
          categoryId: category.categoryId,
          products: []
        });
      }

      // Add the product to the appropriate category
      categoryMap.get(category.categoryId).products.push(item.productName);
    }

    // Convert the map back to an array
    const categoriesAndProducts = Array.from(categoryMap.values());

    res.status(200).json(categoriesAndProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.getByProductName(req.params.productName);
    if (product) {
      const productVariants = await Product.getByProductVariants(product.id);
      const result = {
        ...product,
        variants: productVariants.length ? productVariants : []
      }

      res.status(200).json(result);
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

    // Insert into products table
    const productId = await Product.create(product);
    // Insert into product_price_variants table if variants exist
    if (productId && product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        await Product.createPriceVariant({
          productId: productId,
          variantName: variant.name,
          additionalPrice: variant.additionalPrice,
          stock: variant.stock
        });
      }
    }

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
