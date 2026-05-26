import { users, fills } from "../store";
import { addToUserPosition } from "./matching";

export function liquidationChecks(asset: string, price: number): void {
    for (const user of users) {
        const positionsToLiquidate = user.positions.filter(p =>
            p.market === asset &&
            p.status === "open" && (
                (p.type === "LONG" && price <= p.liquidationPrice) ||
                (p.type === "SHORT" && price >= p.liquidationPrice)
            )
        );

        for (const position of positionsToLiquidate) {
            const oppositeType = position.type === "LONG" ? "SHORT" : "LONG";

            fills.push({
                maker: "liquidation-engine",
                taker: user.userId,
                market: position.market,
                qty: position.qty,
                price,
                long: position.type === "LONG" ? user.userId : "liquidation-engine",
                short: position.type === "SHORT" ? user.userId : "liquidation-engine",
            });

            addToUserPosition(user, position.market as "SOL" | "ETH" | "BTC" | "ZEC", oppositeType, position.qty, position.margin, price);
        }
    }
}