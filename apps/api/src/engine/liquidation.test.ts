import { test, expect, beforeEach } from "bun:test";
import { liquidationChecks } from "./liquidation";
import { users } from "../store";
import type { User } from "../types";

// fresh test user injected before each test
let testUser: User;

beforeEach(() => {
    testUser = {
        userId: "test-liq-user",
        username: "liqtester",
        password: "hashed",
        collateral: { available: 0, locked: 1000 },
        positions: [
            {
                market: "SOL",
                type: "LONG",
                qty: 10,
                margin: 1000,
                liquidationPrice: 80,
                averagePrice: 90,
                pnL: 0,
                status: "open",
            }
        ],
        closedPositions: [],
        orders: [],
    };

    // remove old test user if re-running
    const idx = users.findIndex(u => u.userId === "test-liq-user");
    if (idx !== -1) users.splice(idx, 1);
    users.push(testUser);
});

test("LONG position is liquidated when price falls below liquidationPrice", () => {
    // SOL drops to 75 — below liquidationPrice of 80
    liquidationChecks("SOL", 75);

    const user = users.find(u => u.userId === "test-liq-user")!;
    expect(user.positions.length).toBe(0); // position should be closed
    expect(user.closedPositions.length).toBe(1);
});

test("LONG position is NOT liquidated when price is above liquidationPrice", () => {
    // SOL at 85 — safe
    liquidationChecks("SOL", 85);

    const user = users.find(u => u.userId === "test-liq-user")!;
    expect(user.positions.length).toBe(1); // position stays open
});

test("SHORT position is liquidated when price rises above liquidationPrice", () => {
    testUser.positions[0].type = "SHORT";
    testUser.positions[0].liquidationPrice = 100;
    testUser.positions[0].averagePrice = 90;

    // SOL pumps to 110 — above liquidationPrice of 100
    liquidationChecks("SOL", 110);

    const user = users.find(u => u.userId === "test-liq-user")!;
    expect(user.positions.length).toBe(0);
    expect(user.closedPositions.length).toBe(1);
});
