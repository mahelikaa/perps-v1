import type { User } from "../types";
import { calculateLiquidationPrice } from "./utils";
import { users, fills, orderbooks } from "../store";


export function addToUserPosition(
    user: User,
    market: "SOL" | "ETH" | "BTC" | "ZEC",
    type: "LONG" | "SHORT",
    qty: number,
    margin: number,
    price: number,
): void {
    const position = user.positions.find(p => p.market === market);

    if (!position) {
        user.positions.push({
            market,
            type,
            qty,
            margin,
            averagePrice: price,
            liquidationPrice: calculateLiquidationPrice(type, price, qty, margin),
            pnL: 0,
            status: "open",
        });
        return;
    }

    // case 2: same side
    if (position.type === type) {
        const newQty = position.qty + qty;
        const newAvgPrice = (position.averagePrice * position.qty + price * qty) / newQty;
        const newMargin = position.margin + margin;

        position.qty = newQty;
        position.averagePrice = newAvgPrice;
        position.margin = newMargin;
        position.liquidationPrice = calculateLiquidationPrice(type, newAvgPrice, newQty, newMargin);
        return;
    }

    if (position.type !== type) {

        // full close
        if (position.qty === qty) {
            const realizedPnL = position.type === "LONG"
                ? (price - position.averagePrice) * qty
                : (position.averagePrice - price) * qty;

            const totalMargin = position.margin + margin;
            user.collateral.available += totalMargin + realizedPnL;
            user.collateral.locked -= totalMargin;

            user.closedPositions.push({
                ...position,
                pnL: realizedPnL,
            });
            user.positions = user.positions.filter(p => p.market !== market);
            return;
        }

        if (position.qty > qty) {
            const realizedPnL = position.type === "LONG"
                ? (price - position.averagePrice) * qty
                : (position.averagePrice - price) * qty;

            const releasedMargin = (position.margin * qty) / position.qty;
            const totalMargin = releasedMargin + margin;

            user.collateral.available += totalMargin + realizedPnL;
            user.collateral.locked -= totalMargin;

            user.closedPositions.push({
                market,
                type: position.type,
                qty,
                margin: releasedMargin,
                liquidationPrice: position.liquidationPrice,
                pnL: realizedPnL,
                averagePrice: position.averagePrice,
            });

            position.qty -= qty;
            position.margin -= releasedMargin;
            position.liquidationPrice = calculateLiquidationPrice(
                position.type, position.averagePrice, position.qty, position.margin
            );
            return;
        }

        if (position.qty < qty) {
            const closedQty = position.qty;
            const realizedPnL = position.type === "LONG"
                ? (price - position.averagePrice) * closedQty
                : (position.averagePrice - price) * closedQty;

            const releasedIncomingMargin = (margin * closedQty) / qty;
            const totalMargin = position.margin + releasedIncomingMargin;

            user.collateral.available += totalMargin + realizedPnL;
            user.collateral.locked -= totalMargin;

            user.closedPositions.push({
                ...position,
                pnL: realizedPnL,
            });

            user.positions = user.positions.filter(p => p.market !== market);

            const remainingQty = qty - closedQty;
            const remainingMargin = margin - releasedIncomingMargin;

            user.positions.push({
                market,
                type,
                qty: remainingQty,
                margin: remainingMargin,
                averagePrice: price,
                liquidationPrice: calculateLiquidationPrice(type, price, remainingQty, remainingMargin),
                pnL: 0,
                status: "open",
            });
        }
    }
}

export function matchOrder(
    order: {
        orderId: string,
        market: "SOL" | "ETH" | "BTC" | "ZEC",
        type: "LONG" | "SHORT",
        qty: number,
        margin: number,
        orderType: "limit" | "market",
        price?: number,
    },
    userId: string,
): number {
    const orderbook = orderbooks[order.market];
    if (!orderbook) return 0;

    const user = users.find(u => u.userId === userId);
    if (!user) return 0;

    let remainingQty = order.qty;
    let lastFillPrice = orderbook.lastTradedPrice;

    if (order.type === "LONG") {
        const askPrices = Object.keys(orderbook.asks)
            .map(Number)
            .sort((a, b) => a - b);

        for (const askPrice of askPrices) {
            if (remainingQty === 0) break;
            if (order.orderType === "limit" && askPrice > order.price!) break;

            const priceLevel = orderbook.asks[askPrice];
            if (!priceLevel) continue;

            for (const openOrder of priceLevel.openOrders) {
                if (remainingQty === 0) break;

                const availableQty = openOrder.qty - openOrder.filledQty;
                const fillQty = Math.min(remainingQty, availableQty);

                const seller = users.find(u => u.userId === openOrder.userId);
                if (!seller) continue;

                const sellerOrder = seller.orders.find(o => o.orderId === openOrder.orderId);
                if (!sellerOrder) continue;

                fills.push({
                    maker: openOrder.userId,
                    taker: userId,
                    market: order.market,
                    qty: fillQty,
                    price: askPrice,
                    long: userId,
                    short: openOrder.userId,
                });

                openOrder.filledQty += fillQty;
                remainingQty -= fillQty;
                lastFillPrice = askPrice;

                sellerOrder.filledQty += fillQty;
                if (sellerOrder.filledQty === sellerOrder.qty) {
                    sellerOrder.status = "filled";
                } else {
                    sellerOrder.status = "partially_filled";
                }

                const fillMarginBuyer = (fillQty / order.qty) * order.margin;
                const fillMarginSeller = (fillQty / sellerOrder.qty) * sellerOrder.margin;

                addToUserPosition(user, order.market, "LONG", fillQty, fillMarginBuyer, askPrice);
                addToUserPosition(seller, order.market, "SHORT", fillQty, fillMarginSeller, askPrice);

            }

            priceLevel.openOrders = priceLevel.openOrders.filter(o => o.filledQty < o.qty);
            priceLevel.availableQty = priceLevel.openOrders.reduce((sum, o) => sum + (o.qty - o.filledQty), 0);

            if (priceLevel.openOrders.length === 0) {
                delete orderbook.asks[askPrice];
            }
        }

    } else {
        const bidPrices = Object.keys(orderbook.bids)
            .map(Number)
            .sort((a, b) => b - a);

        for (const bidPrice of bidPrices) {
            if (remainingQty === 0) break;
            if (order.orderType === "limit" && bidPrice < order.price!) break; // price too low

            const priceLevel = orderbook.bids[bidPrice];
            if (!priceLevel) continue;

            for (const openOrder of priceLevel.openOrders) {
                if (remainingQty === 0) break;

                const availableQty = openOrder.qty - openOrder.filledQty;
                const fillQty = Math.min(remainingQty, availableQty);

                const buyer = users.find(u => u.userId === openOrder.userId);
                if (!buyer) continue;

                const buyerOrder = buyer.orders.find(o => o.orderId === openOrder.orderId);
                if (!buyerOrder) continue;

                fills.push({
                    maker: openOrder.userId,
                    taker: userId,
                    market: order.market,
                    qty: fillQty,
                    price: bidPrice,
                    long: openOrder.userId,
                    short: userId,
                });

                openOrder.filledQty += fillQty;
                remainingQty -= fillQty;
                lastFillPrice = bidPrice;

                buyerOrder.filledQty += fillQty;
                if (buyerOrder.filledQty === buyerOrder.qty) {
                    buyerOrder.status = "filled";
                } else {
                    buyerOrder.status = "partially_filled";
                }

                const fillMarginSeller = (fillQty / order.qty) * order.margin;
                const fillMarginBuyer = (fillQty / buyerOrder.qty) * buyerOrder.margin;

                addToUserPosition(user, order.market, "SHORT", fillQty, fillMarginSeller, bidPrice);
                addToUserPosition(buyer, order.market, "LONG", fillQty, fillMarginBuyer, bidPrice);

            }

            priceLevel.openOrders = priceLevel.openOrders.filter(o => o.filledQty < o.qty);
            priceLevel.availableQty = priceLevel.openOrders.reduce((sum, o) => sum + (o.qty - o.filledQty), 0);

            if (priceLevel.openOrders.length === 0) {
                delete orderbook.bids[bidPrice];
            }
        }
    }

    if (remainingQty > 0 && order.orderType === "limit") {
        const side = order.type === "LONG" ? orderbook.bids : orderbook.asks;
        const priceKey = String(order.price);

        if (side[priceKey]) {
            side[priceKey].availableQty += remainingQty;
            side[priceKey].openOrders.push({
                userId,
                qty: order.qty,
                filledQty: order.qty - remainingQty,
                orderId: order.orderId,
                createdAt: new Date(),
            });
        } else {
            side[priceKey] = {
                availableQty: remainingQty,
                openOrders: [{
                    userId,
                    qty: order.qty,
                    filledQty: order.qty - remainingQty,
                    orderId: order.orderId,
                    createdAt: new Date(),
                }],
            };
        }
    }

    if (remainingQty < order.qty) {
        orderbook.lastTradedPrice = lastFillPrice;
    }
    return remainingQty;
}