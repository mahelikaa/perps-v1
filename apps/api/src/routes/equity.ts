import { Router } from "express";
import { auth } from "../middleware/auth";
import { users } from "../store";

const router = Router();

router.get("/equity/available", auth, (req: any, res) => {
    const userId = req.userId;
    const user = users.find(u => u.userId === userId);

    if (!user) {
        return res.status(404).json({
            message: "user not found."
        })
    }
    res.status(200).json({
        available: user.collateral.available,
    })
})

export default router;