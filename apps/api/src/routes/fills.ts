import { Router } from "express";
import { auth } from "../middleware/auth";
import { fills } from "../store";

const router = Router();

router.get("/fills", auth, (req: any , res) => {
    const userId = req.userId;
    const userFills = fills.filter(f => f.maker === userId || f.taker === userId);

    res.status(200).json({
        fills: userFills,
    })
});

export default router;