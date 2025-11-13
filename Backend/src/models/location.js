import pool from "./db.js";

const Location = {
  saveLastLocation: async function(id, locationData) {
    const localDate = new Date();
    localDate.setHours(localDate.getHours() + 2);
    const formattedDate = localDate.toISOString().slice(0, 19).replace('T', ' ');

    const result = await pool.query(
      "INSERT INTO locations (device_id, lat, lng, altitude, horizontal_accuracy, vertical_accuracy, speed, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        locationData.lat,
        locationData.lng,
        locationData.altitude,
        locationData.horizontal_accuracy,
        locationData.vertical_accuracy,
        locationData.speed,
        formattedDate,
      ]
    );

    const insertId = result[0].insertId;
    await pool.query("UPDATE devices SET last_location_id = ? WHERE id = ?", [insertId, id]);

    return insertId;
  },
  getLastDeviceLocation: async (id) => {
    const rows = await pool.query("SELECT l.lat, l.lng, l.altitude, l.horizontal_accuracy, l.vertical_accuracy, l.speed, l.timestamp, l.heading FROM locations as l JOIN devices as d ON d.last_location_id = l.id WHERE d.id = ?", [id])
    return rows[0]
  }
};

export default Location;