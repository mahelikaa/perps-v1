import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const JWT_SECRET = "100k";

const app = express();
app.use(express.json());

type User = {
    userId: number;
    username: string;
    password: string;
    collateral: {
        available: number,
        locked: number,
    };
    positions: {
        market: string,
        type: string,
        qty: number, 
        margin: number,
        liquidationPrice: number,
        pnL?: number,
        averagePrice: number,
    }[];
    orders: {
        orderId: number,
        market: string,
        type: string,
        qty: number,
        margin: number,
        orderType: string,
        price: number,
        status: string
    }[];
}

const users: User[] = [{
    userId: 1,
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
        { orderId: 1, market: "SOL", type: "LONG", qty: 10, margin: 500, orderType: "limit", price: 90, status: "filled" },
        { orderId: 2, market: "ETH", type: "SHORT", qty: 10, margin: 500, orderType: "limit", price: 1900, status: "filled" },
        { orderId: 3, market: "BTC", type: "LONG", qty: 10, margin: 500, orderType: "limit", price: 1900, status: "cancelled" },
    ]
}, {
    userId: 2,
    username: "raman",
    password: "$argon2id$v=19$m=65536,t=2,p=1$0+MmZ4R6gYZjKp0myE1LqGHQ+RzWHh1UcU5KZrviGOc$NyaLx7J+U3WvuMB2wZ2mgBDZAyhA325AKxRy7CjXpbA",
    collateral: {
         available: 2000,
         locked: 2000
    },
    positions: [
        { market: "SOL", type: "SHORT", qty: 10,  margin: 1000, liquidationPrice: 80, pnL: 200, averagePrice: 90 },
        { market: "ETH", type: "LONG", qty: 1, margin: 1000, liquidationPrice: 2000, pnL: -100, averagePrice: 1900 }
    ],
    orders: [
        { orderId: 10, market: "SOL", type: "SHORT", qty: 10, margin: 500, orderType: "market", price: 90, status: "filled" },
        { orderId: 11, market: "ETH", type: "LONG", qty: 10, margin: 500, orderType: "market", price: 1900, status: "filled" },
        { orderId: 12, market: "ZEC", type: "LONG", qty: 10, margin: 500, orderType: "limit", price: 1900, status: "open" },
    ]
}];

type Bid = {
    availableQty: number,
    openOrders: { userId: number, qty: number, filledQty: number, orderId: number, createdAt: Date }[]
}

type Orderbook = {
    bids: Record<string, Bid>,
    asks: Record<string, Bid>,
    lastTradedPrice: number,
    indexPrice: number
}

type Orderbooks = Record<string, Orderbook>

const orderbooks: Orderbooks = {
     SOL: { bids: {}, asks: {}, lastTradedPrice: 90, indexPrice: 90.01 },
     ETH: { bids: {}, asks: {}, lastTradedPrice: 1900, indexPrice: 1899.9 }
}

const fills = [{
    maker: 1,
    taker: 2,
    market: "SOL",
    qty: 10,
    price: 90,
    long: 1,
    short: 2
}, {
    maker: 1,
    taker: 2,
    market: "ETH",
    qty: 1,
    price: 1900,
    long: 2,
    short: 1
}];

function auth(req: any, res: any, next: any){
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({
            message: "no token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {userId: number};
        req.userId = decoded.userId;
        next();
    } catch(e) {
        return res.status(403).json({
            message: "invalid token",
        })
    }
}

app.post("/signup", async (req, res) => {
    const {username, password} = req.body;
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
       return res.status(400).json({
            message: "user already exists",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
 
    const newUser: User = {
        userId: users.length +1,
        username,
        password: hashedPassword,
        collateral: {available: 0, locked: 0},
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
    const {username, password} = req.body;
    const user = users.find((u) => u.username === username);
    if (!user){
        return res.status(403).json({
            message: "wrong credentials",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(403).json({
            message: "wrong credentials",
        });
    }

    const token = jwt.sign(
        {userId: user.userId},
        JWT_SECRET,
    )

    res.status(200).json({ 
        token,
        userId: user.userId,
     });
})
app.post("/onramp", auth, (req: any, res: any) => {
    const userId = req.userId;
    const {amount} = req.body;

    if(!amount || typeof amount !== "number" || amount <= 0){
        return res.status(400).json({
            message: "invalid amount",
        })
    }
    const user = users.find(u => u.userId === userId);

    if(!user){
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
app.post("/order", auth,  (req, res) => {})
app.delete("/order", auth,  (req, res) => {})
app.get("/equity/available", auth, (req, res) => {})
app.get("/positions/open/:marketId", auth, (req, res) => {});
app.get("/positions/closed/:marketId", auth, (req, res) => {});
app.get("/orders/open/:marketId", auth, (req, res) => {})
app.get("/orders/:marketId",auth,  (req, res) => {})
app.get("/fills", auth, (req, res) => {});

async function liqudationChecks(asset: string, price: number) {

}


async function onPriceUpdateFromBinance(asset: string, price: number) {
    liqudationChecks(asset, price);   
}
