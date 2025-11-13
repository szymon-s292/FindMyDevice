import pool from "./db.js";

const Tokens = {
  save: async (token, userId, expiresAt) => {
    const [result] = await pool.query(
      "INSERT INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
      [token, userId, expiresAt]
    );
    return result.insertId;
  },
  getSessionId: async (token) => {
    const [rows] = await pool.query(
      `SELECT id FROM tokens WHERE token = ? LIMIT 1`,
      [token]
    );
    return rows[0]?.id;
  },
  getSession: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM tokens WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },
  getSessionByRefreshToken: async (refreshToken) => {
    const [rows] = await pool.query(
      `SELECT * FROM tokens WHERE token = ? LIMIT 1`,
      [refreshToken]
    );
    return rows[0];
  },
  delete: async (token) => {
    const [result] = await pool.query(`DELETE FROM tokens WHERE token = ?`, [
      token,
    ]);
    return result.affectedRows;
  },
  deleteExpired: async () => {
    const [result] = await pool.query(
      `DELETE FROM tokens WHERE expires_at < NOW()`
    );
    return result.affectedRows;
  },
  deleteById: async (id) => {
    const [result] = await pool.query(`DELETE FROM tokens WHERE id = ?`, [id]);
    return result.affectedRows;
  },
  linkSessionToDevice: async (sessionId, deviceId) => {
    await pool.query(`UPDATE tokens SET device_id = ? WHERE id = ?`, [
      deviceId,
      sessionId,
    ]);
  },
  updateFCMToken: async (deviceId, fcmToken) => {
    await pool.query(`UPDATE devices SET fcm_token = ? WHERE id = ?`, [
      fcmToken,
      deviceId,
    ]);
  },
};

export default Tokens;
