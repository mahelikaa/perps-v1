export type User = {
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
        status: "open" | "closed",
    }[];
    closedPositions: {
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

export type Bid = {
    availableQty: number,
    openOrders: { userId: string, qty: number, filledQty: number, orderId: string, createdAt: Date }[]
}

export type Ask = {
    availableQty: number,
    openOrders: { userId: string, qty: number, filledQty: number, orderId: string, createdAt: Date }[]
}

export type Orderbook = {
    bids: Record<string, Bid>,
    asks: Record<string, Ask>,
    lastTradedPrice: number,
    indexPrice: number
}

export type Orderbooks = Record<string, Orderbook>