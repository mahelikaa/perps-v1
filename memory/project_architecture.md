---
name: project-architecture
description: Planned architecture evolution for perp-v1-boilerplate
metadata:
  type: project
---

Project will eventually be modularized and scaled up. Planned additions:
- Redis streams (for order matching / event-driven architecture)
- A real database (replacing in-memory `users[]` array)
- Modular folder structure (routes, middleware, schemas, services, etc.)

**Why:** Current single-file `index.ts` is a learning/prototyping phase. The goal is a production-style perps exchange backend.

**How to apply:** Don't suggest inline everything — when the user is ready to refactor, suggest a clean folder structure that separates concerns (routes, db, streams, schemas).
