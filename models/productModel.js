const db = require('../config/database');

class Product {
  static async getAll(filters, pagination) {
    let query = `SELECT * FROM products WHERE 1=1`;
    const params = [];

    if (filters.search) {
      query += ` AND name LIKE ?`;
      params.push(`%${filters.search}%`);
    }

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

    query += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getByProductName(productName) {
    const [rows] = await db.query(`SELECT * FROM products WHERE uniqueName = ?`, [productName]);
    return rows[0];
  }

  static async getByProductId(productId) {
    const [rows] = await db.query(`SELECT * FROM products WHERE id = ?`, [productId]);
    return rows[0];
  }


  static async create(product) {
    const [result] = await db.query(`INSERT INTO products (name, description, price, rating, brand) VALUES (?, ?, ?, ?, ?)`,
      [product.name, product.description, product.price, product.rating, product.brand]);
    return result.insertId;
  }

  static async deleteById(id) {
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows;
  }
}

module.exports = Product;
