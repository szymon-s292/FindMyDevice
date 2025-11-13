import auth from "./../middlewares/auth.js"
import Users from "./../models/users.js"
import Tokens from "./../models/tokens.js"
import Devices from "./../models/devices.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import express from "express";

const router = express.Router();

const userCanAccessDevice = async (userId, deviceId) => {
  const deviceIds = await Users.userDevices(userId)

  for(const d of deviceIds) {
    if(d?.device_id == deviceId)
      return true
  }

  return false
}

router.post("/login", async (req, res) => {
    try {
        if (!req?.body?.email || !req?.body?.password)
            return res.status(400).json(null);
        
        const { email, password } = req?.body;
        const user = await Users.getUserByEmail(email);
        
        if (!user)
            return res.status(401).json(null);

        const userId = user.id;
        const hash = user.password;

        const isMatch = bcrypt.compareSync(password, hash);
        if (!isMatch)
            return res.status(401).json(null);

        const expiresAtRefresh = null
        const refreshToken = jwt.sign({userId: userId, email: email}, process.env.JWT_SECRET_REFRESH)

        const insertId = await Tokens.save(refreshToken, userId, expiresAtRefresh)
        const accessToken = jwt.sign({userId: userId, email: email, sessionId: insertId}, process.env.JWT_SECRET_ACCESS, {expiresIn: "2m"})

        res.cookie("refreshToken", refreshToken, {  
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.cookie("accessToken", accessToken, {  
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({accessToken: accessToken, refreshToken: refreshToken})
    } catch(err) {
        res.status(500).json(null)
    }
})

router.post("/refresh", async (req, res) => {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json(null);
    
    const token = authHeader.split(" ")[1];
    
    try {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_REFRESH)
            const sessionId = await Tokens.getSessionId(token)
            if(!sessionId)
                return res.status(401).json(null)

            const accessToken = jwt.sign({userId: decoded.userId, email: decoded.email, sessionId: sessionId}, process.env.JWT_SECRET_ACCESS, {expiresIn: "2m"})

            res.cookie("accessToken", accessToken, {  
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });

            return res.status(200).json({accessToken: accessToken})
        } catch (err) {
            await Tokens.delete(token)
            res.status(401).json(null)
        }
    } catch(err) {
        res.status(500).json(null)
    }
})

router.post("/logout", auth, async (req, res) => {
    try {
        const sessionId = req.user.sessionId
        const session = await Tokens.getSession(sessionId)
        console.log(session)
        if(session?.device_id){
            const deviceId = session.device_id
            const userId = req.user.userId

            const unlinkResult = await Users.unlinkDeviceFromUser(userId, deviceId)
            const deleteDeviceResult = await Devices.deleteDevice(deviceId)
            if(unlinkResult === 0 || deleteDeviceResult === 0) 
                return res.status(500).json(null)
        }

        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")

        const deleteSessionResult = await Tokens.deleteById(sessionId)
        if(deleteSessionResult > 0) 
            res.status(200).json(null)
        else
            res.status(401).json(null)
    } catch(err) {
        console.log(err)
        res.status(500).json(null)
    }
})

export default router;