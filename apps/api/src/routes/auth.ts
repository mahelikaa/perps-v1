import {Router} from "express";
import {users} from "../store";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type {User} from "../types"
import { JWT_SECRET } from "../config";

const router = Router();

router.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
        return res.status(400).json({
            message: "user already exists",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
        userId: crypto.randomUUID(),
        username,
        password: hashedPassword,
        collateral: { available: 0, locked: 0 },
        positions: [],
        orders: [],
    };
    users.push(newUser);

    res.status(200).json({
        message: "user created successfully!",
        userId: newUser.userId,
    })
})
router.post("/signin", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);
    if (!user) {
        return res.status(403).json({
            message: "wrong credentials",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(403).json({
            message: "wrong credentials",
        });
    }

    const token = jwt.sign(
        { userId: user.userId },
        JWT_SECRET,
    )

    res.status(200).json({
        token,
        userId: user.userId,
    });
})

export default router;