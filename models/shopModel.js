const db = require('../config/database');

class Shop {
  static async getProductsByShopId(shopId) {

    const [rows] = await db.query(`SELECT * FROM products WHERE shopId =?`, [shopId]);
    return rows;
  }

  static async getProductByShopIdAndProductId(shopId, productId) {
    const [rows] = await db.query(`SELECT * FROM products WHERE shopId = ? AND id = ?`, [shopId, productId]);
    return rows[0];
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
    const [result] = await db.query(`INSERT INTO products (productName,productQuantity, description, price, rating, brand, uniqueName, categoryId, shopId,
      sku,tags,warrantyInformation, metaTitle, metaDescription, stockStatus, weight, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product.productName,
      product.productQuantity,
      product.description,
      product.price,
      product.rating,
      product.brand,
      product.uniqueName,
      product.categoryId,
      product.shopId,

      product.sku,
      product.tags,
      product.warrantyInformation,
      product.metaTitle,
      product.metaDescription,
      product.stockStatus,
      product.weight,
      product.height
      ]);
    return result.insertId;
  }

  static async updateProduct(product) {
    const [result] = await db.query(`
      UPDATE products
      SET productName = ?,
          productQuantity = ?,
          description = ?,
          price = ?,
          rating = ?,
          brand = ?,
          uniqueName = ?,
          categoryId = ?,
          shopId = ?,
          sku = ?,
          tags = ?,
          warrantyInformation = ?,
          metaTitle = ?,
          metaDescription = ?,
          stockStatus = ?,
          weight = ?,
          height = ?
      WHERE id = ?
    `,
      [
        product.productName,
        product.productQuantity,
        product.description,
        product.price,
        product.rating,
        product.brand,
        product.uniqueName,
        product.categoryId,
        product.shopId,
        product.sku,
        product.tags,
        product.warrantyInformation,
        product.metaTitle,
        product.metaDescription,
        product.stockStatus,
        product.weight,
        product.height,
        product.id // Assuming 'id' is the primary key
      ]
    );

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

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getCustomers(shopId, filters = {}) {
    console.log(filters, 'filters');
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
}

module.exports = Shop;
