import { Router } from "express";
import { auth } from "../middleware/auth";
import { users, VALID_MARKETS } from "../store";

const router = Router();

router.get("/orders/open/:marketId", auth, (req: any, res) => {
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

    const openOrders = user.orders.filter(o => o.market === marketId && (o.status === "open" || o.status === "partially_filled"));

    res.status(200).json({
        orders: openOrders,
    })
})
router.get("/orders/:marketId", auth, (req: any, res) => {
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

    const allOrders = user.orders.filter(o => o.market === marketId);

    res.status(200).json({
        orders: allOrders,
    })
})

export default router;