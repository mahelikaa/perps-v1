import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

const JWT_SECRET = "100k";

const app = express();
app.use(express.json());

type User = {
    userId: string;
    username: string;
    password: string;
    collateral: {
        available: number,
        locked: number,
    };
    positions: {
        market: "SOL" | "ETH" | "BTC" | "ZEC",
        type: "LONG" | "SHORT",
        qty: number,
        margin: number,
        liquidationPrice: number,
        pnL?: number,
        averagePrice: number,
    }[];
    orders: {
        orderId: string,
        market: "SOL" | "ETH" | "BTC" | "ZEC",
        type: "LONG" | "SHORT",
        qty: number,
        margin: number,
        filledQty: number,
        orderType: "limit" | "market",
        price?: number,
        status: "open" | "filled" | "cancelled" | "partially_filled",
    }[];
}
const VALID_MARKETS = ["SOL", "ETH", "BTC", "ZEC"] as const;
const VALID_TYPES = ["LONG", "SHORT"] as const;
const VALID_ORDER_TYPES = ["limit", "market"] as const;
const VALID_STATUS = ["open", "filled", "cancelled", "partially_filled"] as const;

const OnrampSchema = z.object({
    amount: z.number().positive(),
})

const OrderSchema = z.object({
    market: z.enum(VALID_MARKETS),
    type: z.enum(VALID_TYPES),
    orderType: z.enum(VALID_ORDER_TYPES),
    qty: z.number().positive(),
    margin: z.number().positive(),
    price: z.number().positive().optional(),
}).refine((data) => {
    if (data.orderType === "limit" && !data.price) return false;
    return true;
}, { message: "limit orders require a price" })

const users: User[] = [{
    userId: "1",
    username: "harkirat",
    password: "$argon2id$v=19$m=65536,t=2,p=1$6zLZ/leDsgyqBRwj97QOJrDc2NDRfBj79N2LSW0AxXQ$pUuZgAD0aeIvD6RsSfOFu69RWZP2+X7hLwj5ai0Neus",
    collateral: {
        available: 2000,
        locked: 1000
    },
    positions: [
        { market: "SOL", type: "LONG", qty: 10, margin: 500, liquidationPrice: 80, averagePrice: 90 },
        { market: "ETH", type: "SHORT", qty: 1, margin: 500, liquidationPrice: 2000, averagePrice: 1900 }
    ],
    orders: [
        { orderId: "1", market: "SOL", type: "LONG", qty: 10, margin: 500, filledQty: 10, orderType: "limit", price: 90, status: "filled" },
        { orderId: "2", market: "ETH", type: "SHORT", qty: 10, margin: 500, filledQty: 10, orderType: "limit", price: 1900, status: "filled" },
        { orderId: "3", market: "BTC", type: "LONG", qty: 10, margin: 500, filledQty: 8, orderType: "limit", price: 1900, status: "cancelled" },
    ]
}, {
    userId: "2",
    username: "raman",
    password: "$argon2id$v=19$m=65536,t=2,p=1$0+MmZ4R6gYZjKp0myE1LqGHQ+RzWHh1UcU5KZrviGOc$NyaLx7J+U3WvuMB2wZ2mgBDZAyhA325AKxRy7CjXpbA",
    collateral: {
        available: 2000,
        locked: 2000
    },
    positions: [
        { market: "SOL", type: "SHORT", qty: 10, margin: 1000, liquidationPrice: 80, pnL: 200, averagePrice: 90 },
        { market: "ETH", type: "LONG", qty: 1, margin: 1000, liquidationPrice: 2000, pnL: -100, averagePrice: 1900 }
    ],
    orders: [
        { orderId: "10", market: "SOL", type: "SHORT", qty: 10, margin: 500, filledQty: 10, orderType: "market", price: 90, status: "filled" },
        { orderId: "11", market: "ETH", type: "LONG", qty: 10, margin: 500, filledQty: 10, orderType: "market", price: 1900, status: "filled" },
        { orderId: "12", market: "ZEC", type: "LONG", qty: 10, margin: 500, filledQty: 0, orderType: "limit", price: 1900, status: "open" },
    ]
}];

type Bid = {
    availableQty: number,
    openOrders: { userId: string, qty: number, filledQty: number, orderId: string, createdAt: Date }[]
}

type Ask = {
    availableQty: number,
    openOrders: { userId: string, qty: number, filledQty: number, orderId: string, createdAt: Date }[]
}

type Orderbook = {
    bids: Record<string, Bid>,
    asks: Record<string, Ask>,
    lastTradedPrice: number,
    indexPrice: number
}

type Orderbooks = Record<string, Orderbook>

const orderbooks: Orderbooks = {
    SOL: { bids: {}, asks: {}, lastTradedPrice: 90, indexPrice: 90.01 },
    ETH: { bids: {}, asks: {}, lastTradedPrice: 1900, indexPrice: 1899.9 }
}

const fills = [{
    maker: "1",
    taker: "2",
    market: "SOL",
    qty: 10,
    price: 90,
    long: "1",
    short: "2"
}, {
    maker: "1",
    taker: "2",
    market: "ETH",
    qty: 1,
    price: 1900,
    long: "2",
    short: "1"
}];

function auth(req: any, res: any, next: any) {
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

app.post("/signup", async (req, res) => {
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
app.post("/signin", async (req, res) => {
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
app.post("/onramp", auth, (req: any, res: any) => {
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
app.post("/order", auth, (req: any, res) => {
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
app.delete("/order/:orderId", auth, (req: any, res) => {
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
app.get("/equity/available", auth, (req, res) => { })
app.get("/positions/open/:marketId", auth, (req, res) => { });
app.get("/positions/closed/:marketId", auth, (req, res) => { });
app.get("/orders/open/:marketId", auth, (req, res) => { })
app.get("/orders/:marketId", auth, (req, res) => { })
app.get("/fills", auth, (req, res) => { });

async function liqudationChecks(asset: string, price: number) {

}


async function onPriceUpdateFromBinance(asset: string, price: number) {
    liqudationChecks(asset, price);
}
