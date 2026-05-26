import { MAINTENANCE_MARGIN_RATE } from "../config";

export function calculateLiquidationPrice(
    type: "LONG" | "SHORT",
    price: number,
    qty: number,
    margin: number,
): number {
    const maintenanceMargin = price * qty * MAINTENANCE_MARGIN_RATE;
    return type === "LONG"
        ? price - (margin - maintenanceMargin) / qty
        : price + (margin - maintenanceMargin) / qty
}