import auth from "../middlewares/auth.js"
import Devices from "../models/devices.js";
import Tokens from "../models/tokens.js"
import express from "express";
import admin from "../misc/firebase.js";

const router = express.Router();

router.post("/registration", auth, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken?.trim())
            return res.status(400).json({ error: "FCM token required" });

        console.log(fcmToken)

        const session = await Tokens.getSession(req.user.sessionId)
        const deviceId = session.device_id
        if (!deviceId)
            return res.status(400).json({ error: "No device linked to this session" });

        await Tokens.updateFCMToken(deviceId, fcmToken.trim());
        return res.status(200).json(null);
    } catch (err){
        console.log(err)
        return res.status(500).json(null)
    }
})

router.post("/:id/send", auth, async (req, res) => {
    const { title, body } = req.body;
    const deviceId = req.params.id;

    if (!title?.trim() || !body?.trim())
        return res.status(400).json({ error: "Title and body required" });

    const device = await Devices.getDeviceById(deviceId);
    if (!device)
        return res.status(404).json({ error: "Device not found" });

    if (!device.fcm_token)
        return res.status(400).json({ error: "Device has no FCM token registered" });

    const message = {
        data: {
            title: title.trim(),
            body: body.trim()
        },
        token: "d1sAFuB3Scm1CJ06UQUuRr:APA91bEKhw4DUem5Tf9CwwT-zQL8IUxoM05_2i6nUchZ4SOSOpTkPnkIrwVn0OyoDiv0Mx65Ajc0URa6FDIY1VoAxEug06FWnAQqOFGGNnVAVJvZDrPnTrw",
        android: {
            priority: "high",
            ttl: 0
        },
    };

    admin.messaging().send(message)
    .then((response) => {
        console.log("Message sent:", response);
        return res.status(200).json(null);
    })
    .catch((error) => {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Error sending FCM message" });
    });
});
export default router;