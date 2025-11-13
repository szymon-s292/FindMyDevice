import pool from "./db.js";

const Devices = {
  addNewDevice: async (deviceName, fcmToken) => {
    const [result] = await pool.query("INSERT INTO devices (`name`, `fcm_token`) VALUES (?, ?)", [deviceName, fcmToken]);
    return result.insertId;
  },
  deleteDevice: async (deviceId) => {
    const [result] = await pool.query("DELETE FROM devices WHERE id = ?", [deviceId]);
    return result.affectedRows;
  },
  getDeviceById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM devices WHERE id = ? LIMIT 1", [id]);
    return rows[0];
  },
  findAll: async (userId) => {
    const [rows] = await pool.query(`
      SELECT 
        d.id as device_id,
        d.name as device_name,
        l.id as location_id,
        l.lat,
        l.lng,
        l.horizontal_accuracy,
        l.vertical_accuracy,
        l.speed,
        l.altitude,
        l.timestamp 
      FROM devices d 
      LEFT JOIN locations l 
        ON l.id = d.last_location_id 
      JOIN users_devices ud 
        ON d.id = ud.device_id
      WHERE ud.user_id = ?
    `, userId)

    return rows
  }
}

export default Devices;