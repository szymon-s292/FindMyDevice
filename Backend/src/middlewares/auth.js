import jwt from "jsonwebtoken"
import Tokens from "../models/tokens.js"

const auth = async (req, res, next) => {
    const authHeader = req.get("Authorization");

    const accessTokenCookie = req.cookies?.accessToken;
    const refreshTokenCookie = req.cookies?.refreshToken;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
            req.user = decoded;
            return next();
        } catch (err) {
            return res.status(401).json(null);
        }
    } 
    
    if(accessTokenCookie && refreshTokenCookie) {
        try {
            const decoded = jwt.verify(accessTokenCookie, process.env.JWT_SECRET_ACCESS);
            req.user = decoded;
            return next();
        } catch (err) {
            const session = await Tokens.getSessionByRefreshToken(refreshTokenCookie)
            if(!session)
                return res.status(401).json(null);

            try {
                const decodedRefresh = jwt.verify(refreshTokenCookie, process.env.JWT_SECRET_REFRESH);
                const accessToken = jwt.sign({userId: decodedRefresh.userId, email: decodedRefresh.email, sessionId: session.id}, process.env.JWT_SECRET_ACCESS, {expiresIn: "2m"})
                res.cookie("accessToken", accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                });

                req.user = {userId: decodedRefresh.userId, email: decodedRefresh.email, sessionId: session.id};
                return next();
            } catch (err) {
                await Tokens.delete(refreshTokenCookie)
                return res.status(401).json(null);
            }
        }
    }
    return res.status(403).json(null);
}

export default auth