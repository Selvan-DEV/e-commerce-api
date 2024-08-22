const db = require('../config/database');

class Order {
  static async addProductToCart(cartItem) {
    const [result] = await db.query(`INSERT INTO cartitems (productId, quantity, sessionId, userId) VALUES (?, ?, ?, ?)`,
      [cartItem.productId, cartItem.quantity, cartItem.sessionId, cartItem.userId]);

    const [rows] = await db.query(`SELECT * FROM cartitems WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  static async findCartItemBySessionIdAndProductId(sessionId, productId) {
    const [rows] = await db.query(`SELECT * FROM cartitems WHERE sessionId = ? AND productId = ?`, [sessionId, productId]);
    return rows[0];
  }

  static async updateCartItem(quantity, cartItemId) {
    const [result] = await db.query(`UPDATE cartitems SET quantity = ? WHERE id = ?`, [quantity, cartItemId]);
    return result.affectedRows;
  }

  static async deleteCartItem(cartItemId) {
    const [result] = await db.query(`DELETE FROM cartitems WHERE id = ?`, [cartItemId]);
    return result.affectedRows;
  }

  static async getAllCartItemsBySessionId(cartItemId) {
    const [rows] = await db.query(`SELECT * FROM cartitems WHERE sessionId = ? OR userId = ? `, [cartItemId, cartItemId]);
    return rows;
  }

  static async createOrder(orderItem) {
    const [result] = await db.query(`INSERT INTO orders (userId, paymentMethodId, orderAmount, deliveryAddressId, shippingAddressId) VALUES (?, ?, ?, ?, ?)`,
      [orderItem.userId, orderItem.paymentMethodId, orderItem.orderAmount, orderItem.deliveryAddressId, orderItem.shippingAddressId]);
    return result;
  }

  static async addOrderItems(orderProductData) {
    const [result] = await db.query(`INSERT INTO ordersitems (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`,
      [orderProductData.orderId, orderProductData.productId, orderProductData.quantity, orderProductData.price]);
    return result;
  }

  static async deleteCartItemsByUserId(userId) {
    try {
      const [result] = await db.query(`DELETE FROM cartitems WHERE userId = ?`, [userId]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  static async getOrdersByUserId(userId) {
    const [rows] = await db.query(`SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
    return rows;
  }

  static async getOrderByOrderId(orderId) {
    const [rows] = await db.query(`SELECT * FROM ordersitems WHERE orderId = ?`, [orderId]);
    return rows;
  }
}

module.exports = Order;