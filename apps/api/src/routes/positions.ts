import { Router } from "express";
import { auth } from "../middleware/auth";
import { users, VALID_MARKETS } from "../store";

const router = Router();

router.get("/positions/open/:marketId", auth, (req: any, res) => {
    const { marketId } = req.params;
    if (!VALID_MARKETS.includes(marketId as any)) {
        return res.status(400).json({ message: "invalid market" });
    }
    const userId = req.userId;
    const user = users.find(u => u.userId === userId);

    if (!user) {
        return res.status(404).json({
            message: "user not found."
        })
    }

    const openPositions = user.positions.filter(p => p.market === marketId && p.status === "open")

    res.status(200).json({
        positions: openPositions,
    })
});

router.get("/positions/closed/:marketId", auth, (req: any, res) => {
    const { marketId } = req.params;
    if (!VALID_MARKETS.includes(marketId as any)) {
        return res.status(400).json({ message: "invalid market" });
    }
    const userId = req.userId;
    const user = users.find(u => u.userId === userId);

    if (!user) {
        return res.status(404).json({ message: "user not found." })
    }

    const closedPositions = user.positions.filter(p => p.market === marketId && p.status === "closed")

    res.status(200).json({
        positions: closedPositions,
    })
});

export default router;