# Commons Fabric (TCFP Prototype)

## Summary

A community-events platform prototype ("Commons Fabric" / TCFP): organizations post
events, and a public directory/calendar lets visitors browse them. It's an npm
workspaces monorepo with an Express + Prisma/SQLite backend and a React + Vite +
TanStack Router frontend.

## Project Structure

```
backend/                        — Express API server, source of truth for the data model.
├── src/
│   ├── main.ts                 — Process entry point.
│   ├── app.ts                  — App factory: middleware, CORS, route mounting order.
│   ├── db/client.ts            — Shared Prisma client instance.
│   ├── endpoints/               — One router per resource, mounted under /v1.
│   │   ├── auth.ts              — Signup/login/logout, session cookie issuance.
│   │   ├── calendar.ts          — iCalendar (.ics) export: per-event download and subscription feed.
│   │   ├── events.ts            — Event CRUD/listing.
│   │   └── organizations.ts     — Organization CRUD/listing.
│   ├── middleware/
│   │   ├── auth.ts              — requireAuth: reads/verifies the session cookie.
│   │   ├── logging.ts           — Request logging.
│   │   ├── openapi.ts           — express-openapi-validator wiring against docs/api/openapi.yaml.
│   │   └── problemDetails.ts    — Central error handler; formats HttpProblem as application/problem+json.
│   ├── utils/
│   │   ├── constraints.ts       — Shared validation constraints.
│   │   ├── encryption.ts        — Password hashing (argon2id).
│   │   ├── ical.ts              — Serializes events as RFC 5545 VCALENDAR (via ical-generator).
│   │   ├── orgTags.ts           — ORG_TAGS enum values (SQLite has no enum type; mirrors schema.dbml).
│   │   ├── problems.ts          — HttpProblem class and factory helpers (notFound, badRequest, etc).
│   │   └── userSessions.ts      — Session token signing/verification, cookie name.
│   ├── generated/prisma/        — Prisma client output. Generated; gitignored; never hand-edit.
│   └── docs/
│       ├── api/openapi.yaml     — API contract. Every /v1 request/response is validated against this.
│       └── db/                  — schema.dbml (human-readable ER diagram) and schema.dbdiagram.
├── prisma/
│   ├── schema.prisma            — DB schema (SQLite-specific translation of docs/db/schema.dbml).
│   ├── migrations/               — One directory per migration; migration_lock.toml pins the provider.
│   └── seed/                     — Dev seed data (dev-organizations-seed.json) and seed.ts runner.
├── test/                         — api-contract.test.ts (openapi conformance), ical.test.ts (serializer),
│                                   schema-sync.test.ts.
└── scripts/copy-openapi.mjs      — Copies openapi.yaml into dist/ at build time.

frontend/                       — React SPA (Vite, TanStack Router/Query, Tailwind v4).
├── src/
│   ├── main.tsx                 — Entry point; router/query client setup.
│   ├── routes/                   — File-based routes (TanStack Router): __root, index, directory, login.
│   ├── api/                      — Real backend client. client.ts is the only place that calls fetch;
│   │                               auth.ts/events.ts/organizations.ts wrap /v1/* endpoints and hold no
│   │                               state or error interpretation — see api/README.md.
│   ├── mocks/                     — Mock data/backend, the peer of api/. Emptied out as flows wire up.
│   ├── hooks/                     — useAuth (session context), useEvents, useOrganizations, useOverlayContext.
│   ├── components/                — Grouped by Design System page (see components/README.md).
│   │   ├── cards/                  — EventCard, OrgCard (+ Storybook docs.* variants).
│   │   ├── chips/                  — DateChip, Summary, Tag.
│   │   ├── controls/                — Button, Field, Toggle.
│   │   ├── modals/                  — CreateAccountModal, CreateEventModal, EventDetailModal, LoginForm/Modal, Modal, Toast.
│   │   ├── nav/                     — FilterBar, Header (+ .stories.tsx).
│   │   └── views/                   — Calendar, EventCardGrid.
│   ├── docs/                       — Storybook MDX pages (Foundations, Calendar, CardsAndContent, etc).
│   ├── assets/                     — Logo/icon React components.
│   └── utils/
│       ├── datetime.ts              — Date/time formatting helpers.
│       ├── palette.ts               — Per-org color variants as literal Tailwind class strings.
│       ├── stringcheck.ts           — String helpers (org initials).
│       └── types/                   — Shared TS types: dates, events, orgs, users, variants.
├── design/                        — Design reference material (remixed-abfa2797.tsx, README).
└── .storybook/                    — Storybook config (main.ts, preview.tsx).

packages/                       — Internal-only shared workspace packages (never published); see packages/README.md.
├── eslint-config/                — @prototype/eslint-config: shared flat ESLint config.
└── typescript-config/             — @prototype/typescript-config: shared tsconfig presets (base/node/vite).

.devcontainer/                  — Dev container config (devcontainer.json, docker-compose.yml).
.github/dependabot.yml          — Dependency update automation config.
.claude/skills/project-audit/   — Project-audit skill definition used by this repo's Claude Code setup.
eslint.config.mjs               — Root flat config re-exporting @prototype/eslint-config for editor resolution
                                   only; `npm run lint` delegates to each workspace's own config instead.
```

## Development Guidelines

### Comments

Keep comments concise and to a minimum. Exported functions, classes, and non-obvious
constants get a short `/** */` doc comment (usually a few lines explaining *why*,
not what); one-liners or obvious functionality do not need one.  

### Architectural boundaries

- **`frontend/src/api/` is the only place that calls `fetch`.** `client.ts` owns
  request/response handling (prefixing `/v1`, sending the session cookie, converting
  `application/problem+json` into `ApiError`); other modules in that folder wrap one
  endpoint each and hold no state, interpreting no errors themselves. Interpreting a
  failure (e.g. "401 means signed out") belongs to the caller — see `hooks/`.
- **Timestamps are resolved at the `api/` boundary, once.** The API sends RFC 3339
  strings whose offset is authoritative; `api/events.ts` maps every response through
  `toEvent`, which turns each one into a `Date` (an absolute instant). Everything
  downstream holds `Date`s and renders them in the viewer's timezone via
  `utils/datetime.ts` — no component parses a timestamp string, and no formatter
  accepts one. Going the other way, a bare `<input type="date">`/`type="time"` value
  (`DateKey`, "YYYY-MM-DD") carries no offset, so it is read in the viewer's timezone
  and widened into an instant before it is sent (`dayEdge`, `fromDateAndTime`).
- **`frontend/src/mocks/` mirrors `frontend/src/api/`** as a mock-backend peer. Flows
  move from `mocks/` to `api/` as they're wired to the real backend; once `mocks/` is
  empty it can be deleted.
- **Color belongs in Tailwind class names, never in an inline style or a JS color
  string.** `src/index.css` is the only place a color value is written down; use the
  utilities those `@theme` tokens generate (`bg-green-tint`, `text-muted`,
  `border-line`, …) rather than `var(--color-*)` in a `style` prop or a hex/`rgb()`
  literal in a `.ts` file. Class names must be **literal strings** — Tailwind only
  emits a utility it can find in the source, so `` `bg-${key}` `` silently renders
  nothing. For a value that varies at runtime, look the whole class name up in a
  static map; `utils/palette.ts` does this for the six per-organization variants.
- **`backend/src/docs/api/openapi.yaml` is the API contract.** Every request/response
  under `/v1` is validated against it (`middleware/openapi.ts`), so endpoint handlers
  don't need to re-check shapes the schema already guarantees — only rules a JSON
  Schema can't express (e.g. comparing two query params) need explicit checks.
- **`backend/prisma/schema.prisma` is a SQLite-specific translation of
  `backend/src/docs/db/schema.dbml`.** The DBML is the conceptual source of truth
  (enums, Postgres-only constraints); differences are documented at the top of
  `schema.prisma`. Keep both in sync when changing the data model.
- **`backend/src/generated/prisma/` is generated and gitignored.** Never hand-edit it;
  regenerate with `npm run db:generate` after schema changes.
- **Route registration order in `backend/src/app.ts` is load-bearing**: body
  parsing/logging, then routers, then (in production) the static/catch-all handlers,
  then the error handler last. Don't reorder without re-reading the comment there —
  it explains a past bug where the catch-all swallowed real API routes.
- **`packages/` workspaces must not reach outside their own directory.** Each workspace
  declares every dependency it imports and every binary its scripts invoke, rather than
  relying on npm hoisting from the root — see `packages/README.md` for why.

### Commands

- `npm run dev` (root) — runs frontend and backend dev servers concurrently.
- `npm run db:migrate` (backend) — apply/create Prisma migrations against the local
  SQLite dev DB; re-run after pulling new migrations. `npm run db:deploy` applies
  existing migrations only (prod/CI); `npm run db:generate` regenerates the client
  without touching migrations.
- `npm run db:seed` (backend) — loads dev seed data (`prisma/seed/`).
- `npm run storybook` (frontend) — Storybook dev server on a separate port
  (`localhost:6006`); the component docs under `src/docs/*.mdx` live there.
- `npm run generate-routes` (frontend) — regenerates TanStack Router's route tree
  from `src/routes/`; `npm run build` runs this automatically first.

### Workflows

- **Keep the structure section in sync.** When you add, remove, move, or rename a file
  or directory, update the `## Project Structure` tree in the same change, so it never
  drifts from what's actually in the repo.
- **Verify before claiming.** Run the relevant workspace's build/test/lint command
  before reporting work complete, and quote the actual output rather than asserting
  success.
- **Respect the boundaries above.** If a change genuinely needs to cross one (e.g. a
  `fetch` call outside `api/client.ts`, or hand-editing generated Prisma output), say so
  explicitly instead of doing it quietly — these boundaries were drawn on purpose.
- **Treat these guidelines as living.** When corrected on an approach that would recur,
  propose adding it here instead of only fixing the one instance.
