const db = require('../config/database');

class ShopDashboardModel {
  static async getRecentOrders(shopId) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayFormatted = today.toISOString().slice(0, 19).replace('T', ' ');
    const yesterdayFormatted = yesterday.toISOString().slice(0, 19).replace('T', ' ');

    const [rows] = await db.query(
      `SELECT * FROM orders WHERE shopId = ? AND createdAt >= ? AND createdAt < ? ORDER BY createdAt DESC`,
      [shopId, yesterdayFormatted, todayFormatted]
    );
    return rows;
  }

  static async getOrderByOrderId(orderId) {
    const [rows] = await db.query(`SELECT * FROM orderitems WHERE orderId = ?`, [orderId]);
    return rows;
  }

  static async getByProductId(productId) {
    const [rows] = await db.query(`SELECT * FROM products WHERE id = ?`, [productId]);
    return rows[0];
  }

  static async getAddressById(addressId) {
    const [rows] = await db.query(`SELECT * FROM user_addresses WHERE addressId = ?`, [addressId]);
    return rows[0];
  }
}

module.exports = ShopDashboardModel;
