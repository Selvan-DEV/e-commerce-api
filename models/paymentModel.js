const db = require('../config/database');
class Payment {
  static async addPaymentMethodId(paymentMethodData) {
    const [result] = await db.query(`INSERT INTO usercarddetails (userId, paymentMethodId, paymentCustomerId) VALUES (?, ?, ?)`,
      [paymentMethodData.userId, paymentMethodData.paymentMethodId, paymentMethodData.customerId]);

    return result.insertId;
  }

  static async getCustomerIdByUserId(userId) {
    const [result] = await db.query('SELECT  * from usercarddetails WHERE userId = ?', [userId]);
    return result;
  }
}

module.exports = Payment;