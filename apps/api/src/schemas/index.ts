import { z } from "zod";
import { VALID_MARKETS, VALID_TYPES, VALID_ORDER_TYPES } from "../store";

export const OnrampSchema = z.object({
    amount: z.number().positive(),
})

export const OrderSchema = z.object({
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
