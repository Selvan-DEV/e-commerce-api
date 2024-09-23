const db = require('../config/database');

class Shop {
  static async getProductsByShopId(shopId) {

    const [rows] = await db.query(`SELECT * FROM products WHERE shopId =?`, [shopId]);
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
    const [result] = await db.query(`INSERT INTO products (productName,productQuantity, description, price, rating, brand, uniqueName, categoryId, shopId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product.productName, product.productQuantity, product.description, product.price, product.rating, product.brand, product.uniqueName, product.categoryId, product.shopId]);
    return result.insertId;
  }

  static async deleteById(id) {
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows;
  }

  static async getOrdersByShopId(shopId) {
    const [rows] = await db.query(`SELECT * FROM orders WHERE shopId = ?`, [shopId]);
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
