import {Router} from "express";
import {auth} from "../middleware/auth";
import {users, orderbooks} from "../store";
import {OrderSchema} from "../schemas";


const router = Router();

router.post("/order", auth, (req: any, res) => {
    const userId = req.userId;
    const user = users.find(u => u.userId === userId);

    if (!user) {
        return res.status(404).json({
            message: "user not found."
        })
    }

    const result = OrderSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: result.error.issues[0]?.message,
        });
    }

    const { market, type, orderType, qty, margin, price } = result.data;

    if (user.collateral.available < margin) {
        return res.status(400).json({
            message: "insufficient collateral"
        });
    }

    if (!orderbooks[market]) {
        return res.status(400).json({ message: "market not available" });
    }

    user.collateral.available -= margin;
    user.collateral.locked += margin;

    const newOrder = {
        orderId: crypto.randomUUID(),
        market: market,
        type: type,
        qty: qty,
        margin: margin,
        filledQty: 0,
        orderType: orderType,
        price: price,
        status: "open" as const,
    }

    user.orders.push(newOrder);

    res.status(200).json({
        message: "order placed successfully",
        orderId: newOrder.orderId,
    })

})

router.delete("/order/:orderId", auth, (req: any, res) => {
    const userId = req.userId;
    const user = users.find(u => u.userId === userId);

    if (!user) {
        return res.status(404).json({
            message: "user not found."
        })
    }
    const { orderId } = req.params;
    const order = user.orders.find((o) => o.orderId === orderId);

    if (!order) {
        return res.status(404).json({
            message: "order not found",
        })
    }

    if (order.status === "filled" || order.status === "cancelled") {
        return res.status(400).json({
            message: "order either filled or already cancelled.",
        })
    }

    if (order.status === "open" || order.status === "partially_filled") {
        const marketBook = orderbooks[order.market];

        if (!marketBook) {
            return res.status(404).json({ message: "market not found" });
        }
        const side = order.type === "LONG" ? marketBook?.bids : marketBook?.asks;
        const priceLevel = side[String(order.price)];

        if (priceLevel) {
            priceLevel.openOrders = priceLevel.openOrders.filter(o => o.orderId !== orderId);
            priceLevel.availableQty -= order.qty;
            if (priceLevel.openOrders.length === 0) {
                delete side[String(order.price)];
            }
        }

        // same formula works for both open and partially_filled
        const filledRatio = order.filledQty / order.qty;
        const marginToRefund = order.margin * (1 - filledRatio);
        user.collateral.locked -= marginToRefund;
        user.collateral.available += marginToRefund;

        order.status = "cancelled";
    }

    res.status(200).json({
        message: "order cancelled successfully"
    });
});

export default router;