# AGENTS.md

Guide for AI agents and contributors working on this repository. The [README](./README.md) covers installation, deploy, backup and the functional overview; this file contains the working rules and the details that must not be broken.

## Context

Nuxt 4 application (Vue 3 + strict TypeScript) for Luigi's and Marco Antonio's birthday party. It has two faces:

- **Public**: landing page, individual invitation by UUID and RSVP form.
- **Administrative**: login, dashboard, guests, sends, RSVPs and settings.

The interface, user-facing messages and commit messages are in **Brazilian Portuguese**; documentation (README, AGENTS.md and other docs) is in **English**. The visual theme is Spider-Man (red, navy blue, white and light blue), with a comic-book aesthetic.

## Commands

```bash
npm install                 # Node >= 22.22 (a host with Node 20 only emits warnings)

docker compose -f docker-compose.dev.yml up -d   # dev PostgreSQL on port 5433
npm run db:migrate          # applies pending migrations
npm run db:seed             # admin + settings + sample data (dev only)

npm run dev                 # http://localhost:3000
npm run build
npm run preview
npm test                    # Vitest (shared rules)
npm run typecheck           # vue-tsc / Nuxt
npm run db:generate         # generates a migration from the schema
npm run db:studio
npm run admin:create -- --name "Ana" --email ana@exemplo.com --password "senha-longa"
```

Before opening a PR, run **`npm test`, `npm run typecheck` and `npm run build`**. The tests are unit tests; HTTP/database flows need manual verification in dev or a dedicated integration test.

## Repository map

```text
app/                    # Nuxt client
  pages/                # routes (admin/ and convite/[uuid].vue)
  components/           # auto-imported components (pathPrefix: false)
  composables/          # useAuth, useApi, useToast
  layouts/              # admin, auth, public
  middleware/           # admin route guard
  assets/css/main.css   # tokens and Tailwind v4 utilities
server/api/             # Nitro endpoints (admin/, auth/, public/, invite-image/)
server/database/        # schema.ts and client.ts (Drizzle)
server/utils/           # auth, dashboard, queries, settings, uploads, rate limit
server/middleware/      # security headers
shared/                 # config, types, utils and validation (isomorphic)
drizzle/                # SQL migrations + snapshot
scripts/                # seed.ts, create-admin.ts, migrate.mjs (production)
tests/                  # Vitest
docker/                 # production entrypoint
```

The `#shared` alias points to `shared/`. Code in `shared/` runs on the client, on the server and in tests: **never import the database, `node:*` or server APIs there**.

## Rules that must not be broken

1. **The invitation link is unique.** Use `buildInvitationLink()` from `shared/utils/format.ts`, which already includes the `#rsvp` anchor. Never build `/convite/${uuid}` by hand — the guest must land directly on the form.
2. **Party data comes from the database.** Birthday people, ages, date, venue, image, texts and limit live in `party_settings` and are editable at `/admin/configuracoes`. The initial values live in `shared/config/party.ts`; do not hardcode names, address or date in pages.
3. **WhatsApp is manual.** The system only opens `wa.me` with the message ready. Do not simulate automatic sending or attach images. The history (`invitation_sends`) is only recorded after the administrator's explicit confirmation and is append-only (a resend is a new record with a higher `attempt`).
4. **Invitations ≠ people.** An invitation is the row in `invitations`; people are adults + children aged 8–11 + children aged 0–7 from the RSVP. The dashboard computes everything from the database and shows both numbers separately.
5. **Authorization on the server.** Every API under `server/api/admin/**` calls `requireAdmin(event)`. The `admin` middleware only protects navigation; never trust it alone.
6. **Shared validation.** Zod schemas live in `shared/validation`; the server always revalidates. Client-side validation is a convenience only.
7. **Security by default.** No `v-html` with user data; queries only through Drizzle (parameterized); do not expose sequential IDs in public routes; do not log phone numbers, emails or messages; internal errors never reach the client. Login, RSVP and password changes are rate limited.
8. **Controlled uploads.** Invitation image in `DATA_DIR/uploads`, accepting PNG/JPG/WebP up to 5 MB, served by `/api/invite-image/[name]`. The default artwork is `public/images/convite-padrao.svg`.
9. **No dead buttons or mocks in production.** The seed is development-only. Every visible action must actually work.
10. **Single instance.** Rate limiting is in memory and per process. If you scale horizontally, replace `server/utils/rate-limit.ts` with Redis before adding more replicas.

## Database and migrations

- Schema in `server/database/schema.ts`; migrations generated in `drizzle/`.
- Changed the schema? Edit the schema, run `npm run db:generate`, **review the generated SQL** and apply it with `npm run db:migrate`.
- Never edit an already applied migration; create another one.
- In production the container runs `scripts/migrate.mjs` on the entrypoint (`RUN_MIGRATIONS=true`); the seed never runs automatically.
- Runtime env: `DATABASE_URL` and `DATA_DIR` (or `NUXT_DATABASE_URL` / `NUXT_DATA_DIR`). The code falls back to `runtimeConfig`.

## Code conventions

- Strict TypeScript, Vue 3 with `<script setup lang="ts">` and the Composition API. No gratuitous `any`.
- Existing code style: 2 spaces, single quotes, no semicolons.
- Reusable components in `app/components`; avoid creating variations when `AppButton`, `AppModal`, `FormField`, `StatusBadge`, `EmptyState` etc. already solve the problem.
- Styling with Tailwind utilities and theme tokens (`spider-*`, `comic`, shadows). If you need a new color or animation, add it to `main.css` instead of scattering arbitrary values.
- Charts are custom SVG components (`app/components/charts`); do not add a chart library without a real need.
- Displayed dates use the utilities from `shared/utils/format.ts`; phone numbers go through `shared/utils/phone.ts` (Brazilian E.164).
- UI texts in pt-BR, with a welcoming and direct tone.

## Tests

- `tests/` covers phone numbers, messages, RSVP, limits and settings.
- When you change a shared rule, update/add the corresponding test in the same PR.
- Prefer testing pure functions; for the database, validate in the dev environment.

## Git and GitHub Flow

`main` is always ready to deploy. No work goes directly into it.

1. Create a branch from `main`: `feat/…`, `fix/…`, `docs/…` or `chore/…`.
2. Make small, cohesive commits in the format `type: summary in the imperative` (e.g. `fix: ancora o link do convite no RSVP`).
3. Push early to the remote branch and open a PR describing the problem, the solution and how to verify it.
4. Answer the review with new commits on the same branch.
5. With tests/CI green, merge (squash) and delete the branch.
6. Deploy comes from `main`.

CI and publishing:

- `.github/workflows/ci.yml` runs tests, typecheck, build and the image build on PRs. Do not merge with red checks.
- `.github/workflows/publish.yml` publishes `ghcr.io/pedronora/convite-festa` on every push to `main` and on `v*.*.*` tags (`latest`, `main`, `sha-<commit>` and semver versions).
- `docker-compose.ghcr.yml` is the override that swaps the local build for the published image.

Never commit `.env`, `.data/`, `node_modules`, `.nuxt`, `.output` or build artifacts — `.gitignore` already covers those.

## Environment

- Dev database: `postgres://convite:convite@localhost:5433/convite_festa`.
- Seed admin: defined by `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` (minimum 10-character password).
- Seed test invitation: `/convite/11111111-1111-4111-8111-111111111111`.
- The production image uses `node:22-bookworm-slim`. **Do not go back to Alpine** without retesting the client build (Rollup fails with `Code is nested too deeply`).
- The production Compose uses the `convite-festa` project, with the `convite-festa_convite_pgdata` and `convite-festa_convite_uploads` volumes.
- Behind HTTPS, the session cookie automatically becomes `Secure`; the reverse proxy is not part of the Compose file.
