# RidersClub — Enterprise Mobile-First Community Platform

RidersClub is a production-oriented, mobile-first web application for vehicle owners and riders. Users can connect with other riders, create public/private communities, publish blogs, chat privately in real time, organize group rides, request emergency roadside assistance, discover mechanics, maintain private vehicle service records, and list secondhand cars or motorcycles for sale.

---

## Architecture Overview

- **Monorepo Tooling**: `pnpm` workspaces + **Turborepo** (`turbo.json`).
- **Frontend Micro-Frontends**: React + TypeScript + Vite + `@module-federation/vite` + Tailwind CSS + `shadcn/ui`.
  - `apps/shell` (`:5000`) — Host application, global navigation, auth state, persistent 1:1 Chat drawer.
  - `apps/community` (`:5001`) — Blogs, Community discovery, details, moderation, and Community chat.
  - `apps/rides` (`:5002`) — Group ride organization, capacity enforcement, and participant rosters.
  - `apps/help` (`:5003`) — Emergency/roadside assistance requests with consent-based location sharing.
  - `apps/mechanics` (`:5004`) — Mechanic & service provider registration, search, and verification status.
  - `apps/garage` (`:5005`) — Private vehicle profiles, service history logs, reminders, and notes.
  - `apps/marketplace` (`:5006`) — Secondhand car and motorcycle listings.
- **Backend**: `apps/api` (`:4000`) — NestJS Modular Monolith + Prisma ORM + PostgreSQL 16 + Socket.IO.
- **Shared Packages**:
  - `packages/ui` — Shared design system (blue primary palette) and reusable profile/chat trigger components.
  - `packages/types` — Frontend-safe shared TypeScript DTOs, enums, and helpers.
  - `packages/config` — Shared TypeScript (`tsconfig`) and ESLint flat configurations.

---

## Quick Start (Phase 2 Foundation)

### 1. Prerequisites
- **Node.js**: `>= 20.0.0` (LTS v22 recommended)
- **pnpm**: `>= 9.0.0`
- **Docker Desktop**: Running locally for PostgreSQL 16

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Dockerized PostgreSQL & Run Migrations
```bash
# Start PostgreSQL 16 container
pnpm db:up

# Generate Prisma Client & apply database migrations
pnpm db:generate
pnpm db:migrate
```

### 4. Verify Build, Typecheck, Linting & Tests
```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

### 5. Run the Backend API
```bash
pnpm --filter @ridersclub/api dev
```
- Health Check Endpoint: `http://localhost:4000/api/v1/health`
- OpenAPI / Swagger Docs: `http://localhost:4000/api/docs`

