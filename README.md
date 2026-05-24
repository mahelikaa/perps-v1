# perps-v1

Perpetual futures CEX backend. Bun monorepo, built from scratch.

## Stack
Bun · Express · TypeScript · Zod · JWT · bcrypt

## Structure
```
apps/api/     → REST API
packages/     → shared types (WIP)
```

## Run
```sh
bun install
cd apps/api && bun run index.ts
```

## Endpoints
| Method | Route | Auth |
|--------|-------|------|
| POST | `/signup` | ❌ |
| POST | `/signin` | ❌ |
| POST | `/onramp` | ✅ |
| POST | `/order` | ✅ |
| DELETE | `/order/:orderId` | ✅ |
| GET | `/equity/available` | ✅ |
| GET | `/positions/open/:marketId` | ✅ |
| GET | `/positions/closed/:marketId` | ✅ |
| GET | `/orders/open/:marketId` | ✅ |
| GET | `/orders/:marketId` | ✅ |
| GET | `/fills` | ✅ |

## Roadmap
- [x] Auth, collateral, orders, positions, fills
- [ ] Order matching engine
- [ ] Postgres + Redis Streams
- [ ] Liquidation engine
- [ ] WebSocket server
