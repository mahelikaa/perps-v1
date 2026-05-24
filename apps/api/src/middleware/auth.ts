import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export function auth(req: any, res: any, next: any) {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({
            message: "no token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (e) {
        return res.status(403).json({
            message: "invalid token",
        })
    }
}