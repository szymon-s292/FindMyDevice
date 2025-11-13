import auth from "../middlewares/auth.js"
import Users from "../models/users.js"
import Devices from "../models/devices.js"
import Location from "../models/location.js"
import Tokens from "../models/tokens.js"
import express from "express";
import admin from "../misc/firebase.js";
import lastLocationCache from "../misc/cache.js"
import { EventEmitter } from "events";

const router = express.Router();
const locationEvents = new EventEmitter();
locationEvents.setMaxListeners(0); 

router.post("/:id/locate", auth, async (req, res) => {
  const deviceId = req.params.id;
  
  try {
    const device = await Devices.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    if (!device.fcm_token) {
      return res.status(400).json({ error: "Device has no FCM token registered" });
    }

    const prevCachedLocation = lastLocationCache.get(deviceId) || null;
    const eventName = `device-location-${deviceId}`;

    let locationResolver;
    
    const locationPromise = new Promise((resolve) => {
      locationResolver = resolve;
      
      const listener = (locationData) => {
        locationResolver(locationData); 
        locationEvents.off(eventName, listener);
      };

      locationEvents.on(eventName, listener);
    });
    
    const timeoutPromise = new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        locationEvents.removeAllListeners(eventName);
        resolve(prevCachedLocation); 
      }, 11000);
      
      locationPromise.then(() => clearTimeout(timeoutId));
    });

    const message = {
      data: {
        action: "FETCH_LOCATION"
      },
      token: device.fcm_token,
      android: {
        priority: "high",
        ttl: 0
      }
    };

    await admin.messaging().send(message)

    const finalLocation = await Promise.race([locationPromise, timeoutPromise]);
    return res.status(200).json(finalLocation);
  } catch (error) {
    locationEvents.removeAllListeners(`device-location-${deviceId}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gateway", auth, async (req, res) => {
  try {
    const sessionId = req.user.sessionId;
    const session = await Tokens.getSession(sessionId);
    const deviceId = session.device_id;

    if (!deviceId)
      return res.status(400).json({ error: "No device linked to this session" });

    const data = req.body;
    const location = data?.location;

    if (!location)
      return res.status(400).json({ error: "Location data missing" });

    const {lng, lat} = location;
    
    const allExist = [lng, lat].every(v => v !== null && v !== undefined);
    
    if(!allExist)
      return res.status(400).json({ error: "Missing required location coordinates (lng or lat)" });

    const newLocation = { timestamp: Date.now(), ...location };
    lastLocationCache.set(deviceId, newLocation);
    await Location.saveLastLocation(deviceId, location);

    const eventName = `device-location-${deviceId}`;
    locationEvents.emit(eventName, newLocation); 

    return res.status(200).json(null);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/identify", auth, async (req, res) => {
  const { name, fcmToken } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Device name required" });

  const sessionId = req.user.sessionId;
  const userId = req.user.userId;

  const session = await Tokens.getSession(sessionId);
  if(session.deviceId) {
    return res.status(400).json({ error: "Session already linked to a device" });
  }

  const deviceId = await Devices.addNewDevice(name.trim(), fcmToken || null);
  await Users.linkDeviceToUser(userId, deviceId);
  await Tokens.linkSessionToDevice(sessionId, deviceId);

  return res.status(200).json({ id: deviceId, name: name });
});

export default router;