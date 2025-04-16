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

  static async updateCartUserId(userId, sessionId) {
    const [result] = await db.query(`UPDATE cartitems SET userId = ? WHERE sessionId = ? `, [userId, sessionId]);
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
    const [result] = await db.query(`INSERT INTO orders (userId, paymentMethodId, orderAmount, billingAddressId, shippingAddressId, shopId, orderStatus) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderItem.userId, orderItem.paymentMethodId, orderItem.orderAmount, orderItem.billingAddressId, orderItem.shippingAddressId, orderItem.shopId, orderItem.orderStatusId]);
    return result;
  }

  static async addOrderItems(orderProductData) {
    const [result] = await db.query(`INSERT INTO orderitems (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`,
      [orderProductData.orderId, orderProductData.productId, orderProductData.quantity, orderProductData.price]);
    return result;
  }

  static async deleteCartItemsByUserId(userId) {
    try {
      const [result] = await db.query(`DELETE FROM cartitems WHERE userId = ? OR sessionId = ?`, [userId, String(userId)]);
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
    const [rows] = await db.query(`SELECT * FROM orderitems WHERE orderId = ?`, [orderId]);
    return rows;
  }

  static async insertCheckoutSession(data) {
    const { userId,
      shippingAddressId,
      billingAddressId,
      discountCode,
      discountValue,
      deliveryCharge,
      totalPrice,
      finalAmount } = data;

    const [rows] = await db.query(`INSERT INTO checkout_sessions (userId, shippingAddressId, billingAddressId, discountCode, discountValue, deliveryCharge, totalPrice, finalAmount, paymentStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`, [
      userId,
      shippingAddressId,
      billingAddressId,
      discountCode || null,
      discountValue,
      deliveryCharge,
      totalPrice,
      finalAmount
    ]);
    return rows.insertId;
  }

  static async getCheckoutSessionData(id) {
    const [rows] = await db.query(`SELECT * FROM checkout_sessions WHERE id = ?`, [id]);
    return rows[0];
  }
}

module.exports = Order;