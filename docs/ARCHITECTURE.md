# RidersClub — Architecture Decision Records & System Reference (Phases 1–15)

RidersClub is an enterprise mobile-first community, safety, service, and commerce platform for vehicle owners and riders built with **pnpm Workspaces**, **Turborepo**, **React 18**, **Vite 6 Module Federation (`@module-federation/vite`)**, **Tailwind CSS + shadcn/ui (Deep Cobalt & Electric Blue)**, **NestJS 10**, and **Prisma ORM + PostgreSQL 16**.

---

## 1. Monorepo Package & Port Map

| Workspace Package | Directory | Dev Port | Role |
| :--- | :--- | :--- | :--- |
| `@ridersclub/api` | `apps/api` | `:4000` | NestJS 10 Modular Monolith REST + SSE Backend (`/api/v1/*`) |
| `@ridersclub/shell` | `apps/shell` | `:5000` | Host App (Global Nav, Auth/Profile, 1:1 Direct Chat Drawer, `/admin` Moderation Console) |
| `@ridersclub/community` | `apps/community` | `:5001` | Federated Remote — Topic/City Communities & Rider Blogs |
| `@ridersclub/rides` | `apps/rides` | `:5002` | Federated Remote — Group Ride Organization, Capacity & Route Waypoints |
| `@ridersclub/help` | `apps/help` | `:5003` | Federated Remote — Roadside Assistance, Explicit Location Consent & Peer Offers |
| `@ridersclub/mechanics` | `apps/mechanics` | `:5004` | Federated Remote — Mechanics Directory, Phone Privacy & Admin Verification |
| `@ridersclub/garage` | `apps/garage` | `:5005` | Federated Remote — Private Owner-Only Vehicle Garage & Odometer Service Logbook |
| `@ridersclub/marketplace` | `apps/marketplace` | `:5006` | Federated Remote — Secondhand Cars & Bikes Marketplace + Media Validation |
| `@ridersclub/ui` | `packages/ui` | Shared | Deep Cobalt & Electric Blue Design System, Error Boundaries & Cross-MFE Event Helpers |
| `@ridersclub/types` | `packages/types` | Shared | Canonical TypeScript DTOs, Enums & Deterministic Conversation Pair Key Builder |
| `@ridersclub/config` | `packages/config` | Shared | Shared TypeScript, ESLint & Tailwind Presets |

---

## 2. Architecture Decision Records (ADRs)

- **ADR-001 (Modular Monolith First)**: Build `@ridersclub/api` as a cleanly partitioned NestJS modular monolith (`AuthModule`, `ProfilesModule`, `BlogsModule`, `CommunitiesModule`, `MessagingModule`, `RidesModule`, `HelpModule`, `MechanicsModule`, `GarageModule`, `MarketplaceModule`, `AdminModule`, `HealthModule`) backed by Prisma and PostgreSQL 16 so domain transactions remain ACID-compliant while preserving clean module boundaries for future extraction.
- **ADR-002 (Co-located Blogs & Communities)**: Co-locate Rider Blogs and Communities in `apps/community` (`:5001`) so rich post authoring, reaction counters, and moderation primitives are shared without duplicate bundle overhead.
- **ADR-003 (Canonical 1:1 Direct Messaging & Cross-MFE Event Bus)**: Host the global slide-over 1:1 Direct Chat Drawer in `apps/shell` (`:5000`). Any federated remote triggers a conversation via `openDirectChatWithUser(targetUser, contextLabel)` in `@ridersclub/ui`. Conversations enforce a canonical sorted `participantPairKey` (`min(userA, userB):max(userA, userB)`) unique constraint in PostgreSQL so duplicate threads can never be created between the same two riders.
- **ADR-004 (Unified Design System CSS Injection)**: Keep `@ridersclub/ui/styles.css` imported once at the host entry (`apps/shell/src/main.tsx`) and configure `apps/shell/tailwind.config.mjs` to scan all sibling federated remote `src/**/*.{ts,tsx}` files. This prevents duplicate `<style>` tags from overriding responsive layout utilities such as `.md:flex`.
- **ADR-005 (Roadside Help Explicit Consent & Automatic GPS Redaction)**: Require explicit opt-in location consent before attaching coordinates to a help request, display a prominent non-emergency disclaimer (`112` / `911`), and automatically redact `latitude`/`longitude` to `null` as soon as a request transitions to `RESOLVED` or `CANCELLED`.
- **ADR-006 (Mechanic Verification & Phone Masking)**: Default self-registered mechanics to `PENDING_REVIEW`, mask `phoneNumber` unless `contactPhonePublic === true`, and restrict `VERIFIED` badge approval to `ADMIN` actors with `verifiedAt` and `verifiedByAdminId` timestamps.
- **ADR-007 (Strict Owner-Only Garage & Odometer Progression)**: Enforce owner-only access (`ForbiddenException`) on all Garage vehicle profiles, service logs, and private notes, and reject service log entries whose `odometerKm` regresses below the vehicle's `currentOdometerKm` or most recent service record.
- **ADR-008 (Immutable Moderation Audit Ledger)**: Wrap all moderator report resolutions and administrator account status changes in a Prisma `$transaction` that writes an append-only `ModerationAuditLog` record.

| Workspace Package | Directory | Dev Port | Role |
| :--- | :--- | :--- | :--- |
| `@ridersclub/api` | `apps/api` | `:4000` | NestJS 10 Modular Monolith REST + SSE Backend (`/api/v1/*`) |
| `@ridersclub/shell` | `apps/shell` | `:5000` | Host App (Global Nav, Auth/Profile, 1:1 Direct Chat Drawer, `/admin` Moderation Console) |
| `@ridersclub/community` | `apps/community` | `:5001` | Federated Remote — Topic/City Communities & Rider Blogs |
| `@ridersclub/rides` | `apps/rides` | `:5002` | Federated Remote — Group Ride Organization, Capacity & Route Waypoints |
| `@ridersclub/help` | `apps/help` | `:5003` | Federated Remote — Roadside Assistance, Explicit Location Consent & Peer Offers |
| `@ridersclub/mechanics` | `apps/mechanics` | `:5004` | Federated Remote — Mechanics Directory, Phone Privacy & Admin Verification |
| `@ridersclub/garage` | `apps/garage` | `:5005` | Federated Remote — Private Owner-Only Vehicle Garage & Odometer Service Logbook |
| `@ridersclub/marketplace` | `apps/marketplace` | `:5006` | Federated Remote — Secondhand Cars & Bikes Marketplace + Media Validation |
| `@ridersclub/ui` | `packages/ui` | Shared | Deep Cobalt & Electric Blue Design System, Error Boundaries & Cross-MFE Event Helpers |
| `@ridersclub/types` | `packages/types` | Shared | Canonical TypeScript DTOs, Enums & Deterministic Conversation Pair Key Builder |
| `@ridersclub/config` | `packages/config` | Shared | Shared TypeScript, ESLint & Tailwind Presets |

---

## 2. Architecture Decision Records (ADRs)

- **ADR-001 (Modular Monolith First)**: Build `@ridersclub/api` as a cleanly partitioned NestJS modular monolith (`AuthModule`, `ProfilesModule`, `BlogsModule`, `CommunitiesModule`, `MessagingModule`, `RidesModule`, `HelpModule`, `MechanicsModule`, `GarageModule`, `MarketplaceModule`, `AdminModule`, `HealthModule`) backed by Prisma and PostgreSQL 16 so domain transactions remain ACID-compliant while preserving clean module boundaries for future extraction.
- **ADR-002 (Co-located Blogs & Communities)**: Co-locate Rider Blogs and Communities in `apps/community` (`:5001`) so rich post authoring, reaction counters, and moderation primitives are shared without duplicate bundle overhead.
- **ADR-003 (Canonical 1:1 Direct Messaging & Cross-MFE Event Bus)**: Host the global slide-over 1:1 Direct Chat Drawer in `apps/shell` (`:5000`). Any federated remote triggers a conversation via `openDirectChatWithUser(targetUser, contextLabel)` in `@ridersclub/ui`. Conversations enforce a canonical sorted `participantPairKey` (`min(userA, userB):max(userA, userB)`) unique constraint in PostgreSQL so duplicate threads can never be created between the same two riders.
- **ADR-004 (Unified Design System CSS Injection)**: Keep `@ridersclub/ui/styles.css` imported once at the host entry (`apps/shell/src/main.tsx`) and configure `apps/shell/tailwind.config.mjs` to scan all sibling federated remote `src/**/*.{ts,tsx}` files. This prevents duplicate `<style>` tags from overriding responsive layout utilities such as `.md:flex`.
- **ADR-005 (Roadside Help Explicit Consent & Automatic GPS Redaction)**: Require explicit opt-in location consent before attaching coordinates to a help request, display a prominent non-emergency disclaimer (`112` / `911`), and automatically redact `latitude`/`longitude` to `null` as soon as a request transitions to `RESOLVED` or `CANCELLED`.
- **ADR-006 (Mechanic Verification & Phone Masking)**: Default self-registered mechanics to `PENDING_REVIEW`, mask `phoneNumber` unless `contactPhonePublic === true`, and restrict `VERIFIED` badge approval to `ADMIN` actors with `verifiedAt` and `verifiedByAdminId` timestamps.
- **ADR-007 (Strict Owner-Only Garage & Odometer Progression)**: Enforce owner-only access (`ForbiddenException`) on all Garage vehicle profiles, service logs, and private notes, and reject service log entries whose `odometerKm` regresses below the vehicle's `currentOdometerKm` or most recent service record.
- **ADR-008 (Immutable Moderation Audit Ledger)**: Wrap all moderator report resolutions and administrator account status changes in a Prisma `$transaction` that writes an append-only `ModerationAuditLog` record.

