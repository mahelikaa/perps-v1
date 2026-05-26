import { MAINTENANCE_MARGIN_RATE } from "../config";

export function calculateLiquidationPrice(
    type: "LONG" | "SHORT",
    price: number,
    qty: number,
    margin: number,
): number {
    const maintenanceMargin = price * qty * MAINTENANCE_MARGIN_RATE;
    const rawLiqPrice = type === "LONG"
        ? price - (margin - maintenanceMargin) / qty
        : price + (margin - maintenanceMargin) / qty;

    return type === "LONG" ? Math.max(0, rawLiqPrice) : rawLiqPrice;
}