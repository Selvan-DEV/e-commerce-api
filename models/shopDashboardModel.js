const db = require('../config/database');
const { formatDateToMySQL } = require('../lib/DateFormatter');

class ShopDashboardModel {
  static async getRecentOrders(shopId) {

    // const startOfToday = new Date();
    // startOfToday.setHours(0, 0, 0, 0);

    // const startOfTomorrow = new Date(startOfToday);
    // startOfTomorrow.setDate(startOfToday.getDate() + 1);

    // const todayFormatted = formatDateToMySQL(startOfToday);
    // const tomorrowFormatted = formatDateToMySQL(startOfTomorrow);

    const [rows] = await db.query(
      `SELECT * FROM orders WHERE shopId = ? AND orderStatus = 1 ORDER BY createdAt DESC`,
      [shopId]
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

  static async fetchMonthlyRevenue(shopId) {
    const [rows] = await db.query(
      `
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        SUM(orderAmount) as totalRevenue
      FROM orders
      WHERE shopId = ?
      GROUP BY month
      ORDER BY month ASC
      `,
      [shopId]
    );
    return rows;
  }

  static async getDailyRevenueData(shopId) {
    const [rows] = await db.query(
      `SELECT DATE(createdAt) AS date, SUM(orderAmount) AS totalRevenue 
       FROM orders 
       WHERE shopId = ? 
       GROUP BY DATE(createdAt)
       ORDER BY DATE(createdAt)`,
      [shopId]
    );
    return rows;
  }
}

module.exports = ShopDashboardModel;
