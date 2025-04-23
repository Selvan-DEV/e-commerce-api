const db = require('../config/database');

class Shop {
  static async getProductsByShopId(shopId) {

    const [rows] = await db.query(`SELECT * FROM products WHERE shopId = ? ORDER BY 1 DESC`, [shopId]);
    return rows;
  }

  static async getProductByShopIdAndProductId(shopId, productId) {
    const [rows] = await db.query(`SELECT * FROM products WHERE shopId = ? AND id = ?`, [shopId, productId]);
    return rows[0];
  }

  static async getProductPriceVariants(productId) {
    const [rows] = await db.query(`SELECT * FROM product_price_variants WHERE productId = ?`, [productId]);
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

  static async getProductById(productId) {
    const [rows] = await db.query(`SELECT * FROM products WHERE id = ?`, [productId]);
    return rows[0];
  }

  static async getCategoryById(categoryId) {
    const [rows] = await db.query(`SELECT * FROM productscategory WHERE categoryId = ?`, [categoryId]);
    return rows[0];
  }

  static async getCategoriesByShopId(shopId) {
    const [rows] = await db.query(`SELECT * FROM productscategory WHERE shopId = ?`, [shopId]);
    return rows;
  }

  static async create(product) {
    const [result] = await db.query(
      `INSERT INTO products 
          (sku, brand, brandId, description, tags, warrantyInformation, imageUrl, price, discountPrice, productName, 
           metaTitle, metaDescription, productQuantity, stockStatus, visibility, weight, length, width, height, 
           rating, reviewsCount, averageReviewRating, uniqueName, categoryId, shopId, supplierId, taxClass, 
           shippingClass, ingredients, offerPrice, offerStartDate, offerEndDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        product.ingredients,
        product.offerPrice,
        product.offerStartDate,
        product.offerEndDate,
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

  static async updateProduct(product) {
    const [result] = await db.query(
      `
      UPDATE products
      SET 
        sku = ?,
        productName = ?,
        description = ?,
        productQuantity = ?,
        price = ?,
        offerPrice = ?,
        offerStartDate = ?,
        offerEndDate = ?,
        metaTitle = ?,
        metaDescription = ?,
        imageUrl = ?,
        height = ?,
        brand = ?,
        brandId = ?,
        stockStatus = ?,
        categoryId = ?,
        ingredients = ?,
        updatedAt = NOW()
      WHERE id = ?
      `,
      [
        product.sku,
        product.productName,
        product.description,
        product.productQuantity,
        product.price,
        product.offerPrice,
        product.offerStartDate,
        product.offerEndDate,
        product.metaTitle,
        product.metaDescription,
        product.imageUrl,
        product.height,
        product.brand,
        product.brandId,
        product.stockStatus,
        product.categoryId,
        product.ingredients,
        product.id
      ]
    );

    return result.affectedRows;
  }

  static async updateProductVariant(variant) {
    const [result] = await db.query(
      `
      UPDATE product_price_variants
      SET 
        variantName = ?,
        additionalPrice = ?,
        stock = ?,
        updatedAt = NOW()
      WHERE variantsId = ?
      `,
      [
        variant.variantName,
        variant.additionalPrice,
        variant.stock,
        variant.variantsId
      ]
    );

    return result.affectedRows;
  }

  static async deleteVariantsByProductId(productId) {
    const sql = "DELETE FROM product_price_variants WHERE productId = ?";
    const [result] = await db.execute(sql, [productId]);
    return result.affectedRows;
  }

  static async deleteById(id) {
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows;
  }

  static async getOrdersByShopId(shopId, filters = {}) {
    let query = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (shopId) {
      query += ` AND shopId = ?`;
      params.push(shopId);
    }

    if (filters.status) {
      query += ` AND orderStatus = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY orderId DESC`;
    const [rows] = await db.query(query, params);
    return rows;
  }


  static async getCustomers(shopId, filters = {}) {
    let query = `SELECT * FROM users WHERE role != ?`; // Always exclude admin users
    const params = ['Admin']; // Always exclude 'Admin'

    if (shopId) {
      query += ` AND shopId = ?`;
      params.push(shopId);
    }

    // Check if the searchQuery is not an empty string or undefined
    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const searchPattern = `%${filters.searchQuery.trim()}%`; // Using wildcard for partial matching
      query += ` AND (firstName LIKE ? OR lastName LIKE ?)`;
      params.push(searchPattern, searchPattern);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getOrderByOrderId(orderId) {
    const [rows] = await db.query(`SELECT * FROM orders WHERE orderId = ?`, [orderId]);
    return rows[0];
  }

  static async getAddressDetailsById(addressId) {
    const [rows] = await db.query(`SELECT * FROM user_addresses WHERE addressId = ?`, [addressId]);
    return rows[0];
  }

  static async getOrderStatuses() {
    const [rows] = await db.query(`SELECT * FROM orderstatus`);
    return rows;
  }

  static async getOrderStatusById(orderStatusId) {
    const [rows] = await db.query(`SELECT * FROM orderstatus WHERE orderStatusId = ?`, [orderStatusId]);
    return rows[0];
  }

  static async getOrderItemsByOrderId(orderId) {
    const [rows] = await db.query(`SELECT * FROM orderitems WHERE orderId = ?`, [orderId]);
    return rows;
  }

  static async updateOrderStatus(orderStatusId, orderId) {
    const [rows] = await db.query(`UPDATE orders set orderStatus = ? where orderId = ?`, [orderStatusId, orderId]);
    return rows.affectedRows;
  }

  static async getAllCouponsByShopId(shopId) {
    const [rows] = await db.query(`SELECT * FROM coupons WHERE ShopId = ? ORDER BY 1 DESC`, [shopId]);
    return rows;
  }

  static async getCouponById(shopId, couponId) {
    const [rows] = await db.query(`SELECT * FROM coupons WHERE ShopId = ? AND id = ?`, [shopId, couponId]);
    return rows[0];
  }

  static async insertNewCoupon(couponData) {
    const { code, value, expiryDate, userId, shopId } = couponData;
    const [result] = await db.query(
      `INSERT INTO coupons (code, type, value, expiryDate, usageLimit, usedCount, isActive, userId, createdAt, updatedAt, ShopId)
       VALUES (?, ?, ?, ?, ?, 0, 1, ?, NOW(), NOW(), ?)`,
      [code, "fixed", value, expiryDate, 0, userId, shopId]
    );
    return result.insertId;
  }

  static async updateCoupon(couponData, couponId) {
    const { code, value, expiryDate, userId } = couponData;
    const [result] = await db.query(
      `UPDATE coupons SET code = ?, type = ?, value = ?, expiryDate = ?, usageLimit = ?, userId = ?, updatedAt = NOW()
     WHERE id = ?`,
      [code, "fixed", value, expiryDate, 0, userId, couponId]
    );
    return result.affectedRows;
  }

  static async makeCouponInactive(isActive, couponId) {
    const [rows] = await db.query(`UPDATE coupons SET isActive = ?, updatedAt = NOW() WHERE id = ?`, [isActive ? 1 : 0, couponId]);
    return rows.affectedRows;
  }

  static async getAllreviewsByShopId(shopId) {
    const [rows] = await db.query(`SELECT * FROM reviews WHERE shopId = ? ORDER BY 1 DESC`, [shopId]);
    return rows;
  }

  static async updateReviewStatus(reviewId, isShow) {
    const [rows] = await db.query(`UPDATE reviews SET isShow = ?, updatedAt = NOW() WHERE id = ?`, [isShow, reviewId]);
    return rows.affectedRows;
  }

  static async updatePopularStatus(productId, isPopular) {
    const [rows] = await db.query(`UPDATE products SET isPopular = ?  WHERE id = ?`, [isPopular, productId]);
    return rows.affectedRows;
  }
}

module.exports = Shop;
