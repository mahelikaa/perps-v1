import {Router} from "express";
import {auth} from "../middleware/auth";
import {users} from "../store";
import {OnrampSchema} from "../schemas";

const router =Router();

router.post("/onramp", auth, (req: any, res: any) => {
    const userId = req.userId;
    const result = OnrampSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: result.error.issues[0]?.message,
        });
    }

    const { amount } = result.data;
    const user = users.find(u => u.userId === userId);

    if (!user) {
        return res.status(404).json({
            message: "user not found."
        })
    }

    user.collateral.available += amount;

    res.status(200).json({
        message: "onramp successful",
        available: user.collateral.available
    });
})

export default router;
