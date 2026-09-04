---
name: Imported Replit database setup
description: Non-interactive schema initialization for imported apps using Replit's development PostgreSQL database
---

Imported SendavaPay projects can connect successfully to Replit PostgreSQL while still having only startup-created technical tables. Drizzle Kit push may stop on a named-schema confirmation when run without a TTY, even with force enabled. Initialize the missing application tables idempotently from the source schema, then apply the project's idempotent migration script; never drop existing tables or assume a successful connection means the application schema exists.

**Why:** A connected but empty development database produces a healthy server and a visible landing page while authenticated and dashboard API routes fail on missing relations.

**How to apply:** When setting up an imported app with the same pattern, inspect the development table list before testing routes and use a non-destructive, non-interactive schema initialization path.