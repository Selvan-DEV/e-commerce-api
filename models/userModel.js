const db = require('../config/database');

class User {
  static async createUser(userData) {
    const { firstName, lastName, email, phoneNumber, isPrimaryUser, isActive, password, role } = userData;
    const [result] = await db.query(`
            INSERT INTO users (firstName, lastName, email, phoneNumber, isPrimaryUser, isActive, password, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phoneNumber, isPrimaryUser, isActive, password, role]);
    return result.insertId;
  }

  static async findUserByEmailOrPhone(email, phoneNumber) {
    const [rows] = await db.query(`
        SELECT * FROM users WHERE (email = ? OR phoneNumber = ?) AND role = ?`,
      [email, phoneNumber]
    );
    return rows[0];
  }

  static async findAdminUser(email, phoneNumber) {
    const [rows] = await db.query(`
        SELECT * FROM users WHERE (email = ? OR phoneNumber = ?)`,
      [email, phoneNumber]
    );
    return rows[0];
  }

  static async getUserById(userId) {
    const [rows] = await db.query(`SELECT * FROM users WHERE userId = ?`, [userId]);
    return rows[0];
  }

  static async updateUser(userId, userData) {
    const { firstName, lastName, email, phoneNumber, isPrimaryUser, isActive } = userData;
    const [result] = await db.query(`
            UPDATE users SET firstName = ?, lastName = ?, email = ?, phoneNumber = ?, isPrimaryUser = ?, isActive = ?
            WHERE userId = ?`,
      [firstName, lastName, email, phoneNumber, isPrimaryUser, isActive, userId]);
    return result.affectedRows;
  }

  static async deleteUser(userId) {
    const [result] = await db.query(`UPDATE users SET isActive = false WHERE userId = ?`, [userId]);
    return result.affectedRows;
  }

  static async getUserAddresses(userId) {
    const [rows] = await db.query(`SELECT * FROM user_addresses WHERE userId = ?`, [userId]);
    return rows;
  }

  static async addUserAddress(userId, address) {
    const { firstName, lastName, phoneNumber, pincode, locality, address: addr, city, state, landmark, alternatePhoneNumber, addressType } = address;
    const [result] = await db.query(`
            INSERT INTO user_addresses (userId, firstName, lastName, phoneNumber, pincode, locality, address, city, state, landmark, alternatePhoneNumber, addressType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, phoneNumber, pincode, locality, addr, city, state, landmark, alternatePhoneNumber, addressType]);
    return result.insertId;
  }

  static async updateUserAddress(addressId, address) {
    const { firstName, lastName, phoneNumber, pincode, locality, address: addr, city, state, landmark, alternatePhoneNumber, addressType, isActiveAddress } = address;
    const [result] = await db.query(`
            UPDATE user_addresses SET firstName = ?, lastName = ?, phoneNumber = ?, pincode = ?, locality = ?, address = ?, city = ?, state = ?, landmark = ?, alternatePhoneNumber = ?, addressType = ?, isActiveAddress = ?
            WHERE addressId = ?`,
      [firstName, lastName, phoneNumber, pincode, locality, addr, city, state, landmark, alternatePhoneNumber, addressType, isActiveAddress, addressId]);
    return result.affectedRows;
  }

  static async getActiveAddressByUserId(userId) {
    const [rows] = await db.query('SELECT * FROM user_addresses WHERE userId = ?', [userId]);
    return rows;
  }

  static async deleteUserAddress(addressId) {
    const [result] = await db.query(`DELETE FROM user_addresses WHERE addressId = ?`, [addressId]);
    return result.affectedRows;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async updatePassword(userId, hashedPassword) {
    const [result] = await db.query('UPDATE users SET password = ? WHERE userId = ?', [hashedPassword, userId]);
    return result;
  }

  static async getCoupon(code) {
    const [rows] = await db.query(`SELECT * FROM coupons WHERE code = ? AND isActive = TRUE AND expiryDate > NOW()`, [code]);
    return rows[0];
  }
}


module.exports = User;