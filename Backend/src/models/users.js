import pool from "./db.js";

const Users = {
  getUserByEmail: async (email) => {
    const rows = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    return rows[0] ? rows[0][0] : null
  },
  userDevices: async (userId) => {
    const [rows] = await pool.query("SELECT device_id FROM users_devices WHERE user_id = ?", [userId])
    return rows
  },
  linkDeviceToUser: async (userId, deviceId) => {
    await pool.query("INSERT INTO users_devices (user_id, device_id) VALUES (?, ?)", [userId, deviceId])
  },
  unlinkDeviceFromUser: async (userId, deviceId) => {
    await pool.query("DELETE FROM users_devices WHERE user_id = ? AND device_id = ?", [userId, deviceId])
  }
}

export default Users;