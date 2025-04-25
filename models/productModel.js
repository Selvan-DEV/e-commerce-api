const db = require('../config/database');

class Product {
  static async getAll(filters, pagination) {
    let query = `SELECT * FROM products WHERE 1=1 ORDER BY 1 DESC`;
    const params = [];

    // if (filters.search) {
    //   query += ` AND productName LIKE ?`;
    //   params.push(`%${filters.search}%`);
    // }

    if (filters.priceRange) {
      query += ` AND price BETWEEN ? AND ?`;
      params.push(filters.priceRange.min, filters.priceRange.max);
    }

    if (filters.rating) {
      query += ` AND rating >= ?`;
      params.push(filters.rating);
    }

    if (filters.brand) {
      query += ` AND brand = ?`;
      params.push(filters.brand);
    }

    if (filters.categoryId) {
      query += ` AND categoryId = ?`;
      params.push(filters.categoryId);
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getAllProducts() {
    const [rows] = await db.query(`SELECT * FROM products`);
    return rows;
  }

  static async getByProductName(productName) {
    const [rows] = await db.query(`SELECT * FROM products WHERE uniqueName = ?`, [productName]);
    return rows[0];
  }

  static async getByProductVariants(productId) {
    const [rows] = await db.query(`SELECT * FROM product_price_variants WHERE productId = ?`, [productId]);
    return rows;
  }

  static async getByProductId(productId) {
    const [rows] = await db.query(`SELECT * FROM products WHERE id = ?`, [productId]);
    return rows[0];
  }

  static async getCategoryById(categoryId) {
    const [rows] = await db.query(`SELECT * FROM productscategory WHERE categoryId = ?`, [categoryId]);
    return rows[0];
  }

  static async create(product) {
    const [result] = await db.query(
      `INSERT INTO products 
        (sku, brand, brandId, description, tags, warrantyInformation, imageUrl, price, discountPrice, productName, 
         metaTitle, metaDescription, productQuantity, stockStatus, visibility, weight, length, width, height, 
         rating, reviewsCount, averageReviewRating, uniqueName, categoryId, shopId, supplierId, taxClass, 
         shippingClass, priceVariantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.sku,
        product.brand,
        product.brandId,
        product.description,
        product.tags,
        product.warrantyInformation,
        product.imageUrl,
        product.price,
        product.discountPrice,
        product.productName,
        product.metaTitle,
        product.metaDescription,
        product.productQuantity,
        product.stockStatus,
        product.visibility,
        product.weight,
        product.length,
        product.width,
        product.height,
        product.rating,
        product.reviewsCount,
        product.averageReviewRating,
        product.uniqueName,
        product.categoryId,
        product.shopId,
        product.supplierId,
        product.taxClass,
        product.shippingClass,
        product.priceVariantId,
      ]
    );

    return result.insertId;
  }

  static async createPriceVariant(variant) {
    const [result] = await db.query(
      `INSERT INTO product_price_variants 
        (productId, variantName, additionalPrice, stock, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        variant.productId,
        variant.variantName,
        variant.additionalPrice,
        variant.stock
      ]
    );

    return result.insertId;
  }

  static async getVariantById(id) {
    const [rows] = await db.query(`SELECT * FROM product_price_variants WHERE variantsId = ?`, [id]);
    return rows[0];
  }


  static async deleteById(id) {
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows;
  }

  static async insertReview(reviewData) {
    const [result] = await db.query(
      `INSERT INTO reviews (productId, userId, rating, comment, email, shopId, customerName, isShow) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [reviewData.productId, reviewData.userId, reviewData.rating, reviewData.comment || null, reviewData.email, 1, reviewData.customerName, 1]
    );

    return result.insertId;
  }

  static async updateAverageRating(productId) {
    const [result] = await db.query(
      `UPDATE products
       SET averageRating = (SELECT AVG(rating) FROM reviews WHERE productId = ?),
           reviewCount = (SELECT COUNT(*) FROM reviews WHERE productId = ?)
       WHERE id = ?`,
      [productId, productId, productId]
    );

    return result.affectedRows;
  }

  static async getReviewsByProductId(reviewId) {
    const [rows] = await db.query(`SELECT * FROM reviews WHERE productId = ? AND isShow = 1`, [reviewId]);
    return rows;
  }

  static async getPopularProducts() {
    const [rows] = await db.query(`SELECT * FROM products WHERE isPopular = 1`);
    return rows;
  }

  static async getTopSaleProducts() {
    const [rows] = await db.query(`SELECT 
        p.id,
        p.productName,
        p.uniqueName,
        p.averageRating,
        p.imageUrl,
        p.price,
        SUM(oi.quantity) AS totalSold,
        SUM(oi.quantity * oi.price) AS totalRevenue
      FROM orderitems oi
      JOIN orders o ON oi.orderId = o.orderId
      JOIN products p ON oi.productId = p.id
      WHERE MONTH(o.createdAt) = MONTH(CURRENT_DATE())
        AND YEAR(o.createdAt) = YEAR(CURRENT_DATE())
      GROUP BY p.id, p.productName
      ORDER BY totalSold DESC`);
    return rows;
  }
}

module.exports = Product;
