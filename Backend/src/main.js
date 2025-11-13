import Users from "./models/users.js"
import Tokens from "./models/tokens.js"
import auth from "./middlewares/auth.js"
import authRouter from "./routes/auth.js"
import deviceRouter from "./routes/device.js"
import fcmRouter from "./routes/fcm.js"
import userRouter from "./routes/user.js"

import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
dotenv.config();

const app = express()
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.get("/protected", auth, async (req, res) => res.status(200).json(null))

app.use("/auth", authRouter)
app.use("/device", deviceRouter)
app.use("/fcm", fcmRouter)
app.use("/user", userRouter)