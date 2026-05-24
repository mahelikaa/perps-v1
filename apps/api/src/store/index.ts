import type { User, Orderbooks } from "../types";

export const VALID_MARKETS = ["SOL", "ETH", "BTC", "ZEC"] as const;
export const VALID_TYPES = ["LONG", "SHORT"] as const;
export const VALID_ORDER_TYPES = ["limit", "market"] as const;
export const VALID_STATUS = ["open", "filled", "cancelled", "partially_filled"] as const;

export const users: User[] = [{
    userId: "1",
    username: "harkirat",
    password: "$argon2id$v=19$m=65536,t=2,p=1$6zLZ/leDsgyqBRwj97QOJrDc2NDRfBj79N2LSW0AxXQ$pUuZgAD0aeIvD6RsSfOFu69RWZP2+X7hLwj5ai0Neus",
    collateral: {
        available: 2000,
        locked: 1000
    },
    positions: [
        { market: "SOL", type: "LONG", qty: 10, margin: 500, liquidationPrice: 80, averagePrice: 90, status: "open" },
        { market: "ETH", type: "SHORT", qty: 1, margin: 500, liquidationPrice: 2000, averagePrice: 1900, status: "open" }
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
        { market: "SOL", type: "SHORT", qty: 10, margin: 1000, liquidationPrice: 80, pnL: 200, averagePrice: 90, status: "open" },
        { market: "ETH", type: "LONG", qty: 1, margin: 1000, liquidationPrice: 2000, pnL: -100, averagePrice: 1900, status: "open" }
    ],
    orders: [
        { orderId: "10", market: "SOL", type: "SHORT", qty: 10, margin: 500, filledQty: 10, orderType: "market", price: 90, status: "filled" },
        { orderId: "11", market: "ETH", type: "LONG", qty: 10, margin: 500, filledQty: 10, orderType: "market", price: 1900, status: "filled" },
        { orderId: "12", market: "ZEC", type: "LONG", qty: 10, margin: 500, filledQty: 0, orderType: "limit", price: 1900, status: "open" },
    ]
}];

export const orderbooks: Orderbooks = {
    SOL: { bids: {}, asks: {}, lastTradedPrice: 90, indexPrice: 90.01 },
    ETH: { bids: {}, asks: {}, lastTradedPrice: 1900, indexPrice: 1899.9 }
}

export const fills = [{
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
