import auth from "../middlewares/auth.js"
import Devices from "../models/devices.js"
import express from "express";

const router = express.Router();

router.get("/devices", auth, async (req, res) => {
  const rows = await Devices.findAll(req.user.userId)

  const devices = rows.map(row => ({
    id: row.device_id,
    name: row.device_name,
    last_location: (row.location_id) ? {
      id: row.location_id,
      lat: row.lat,
      lng: row.lng,
      horizontal_accuracy: row.horizontal_accuracy,
      vertical_accuracy: row.vertical_accuracy,
      speed: row.speed,
      altitude: row.altitude,
      timestamp: row.timestamp.toISOString(),
    } : null
  }));

  return res.status(200).json(devices)
})


export default router;