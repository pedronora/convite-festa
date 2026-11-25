# AGENTS.md

Guide for AI agents and contributors working on this repository. The [README](./README.md) covers installation, deploy, backup and the functional overview; this file contains the working rules and the details that must not be broken.

## Context

Nuxt 4 application (Vue 3 + strict TypeScript) for Luigi's and Marco Antonio's birthday party. It has two faces:

- **Public**: landing page, individual invitation by UUID and RSVP form.
- **Administrative**: login, dashboard, guests, sends, RSVPs and settings.

The interface, user-facing messages and commit messages are in **Brazilian Portuguese**; documentation (README, AGENTS.md and other docs) is in **English**. The visual theme is Spider-Man (red, navy blue, white and light blue), with a comic-book aesthetic.

## Commands

```bash
nvm use                     # Node 22.22 from .nvmrc — mandatory (ESLint 10 breaks on Node 20)
npm install

docker compose -f docker-compose.dev.yml up -d   # dev PostgreSQL on port 5433
npm run db:migrate          # applies pending migrations
npm run db:seed             # admin + settings + sample data (dev only)

npm run dev                 # http://localhost:3000
npm run build
npm run preview
npm test                    # Vitest (shared rules)
npm run typecheck           # vue-tsc / Nuxt
npm run lint                # ESLint (@nuxt/eslint)
npm run lint:fix            # ESLint with automatic fixes
npm run db:generate         # generates a migration from the schema
npm run db:studio
npm run admin:create -- --name "Ana" --email ana@exemplo.com --password "uma-senha-bem-longa"
```

Before opening a PR, run **`npm run lint`, `npm test`, `npm run typecheck` and `npm run build`**. Run `nvm use` first: on Node 20, `npm run lint` crashes with `Object.groupBy is not a function` (ESLint 10 requires Node 21+), even though `npm test` still passes. The tests are unit tests; HTTP/database flows need manual verification in dev or a dedicated integration test.

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
3. **WhatsApp is manual.** The system only opens an `api.whatsapp.com/send` link with the message ready. Do not simulate automatic sending or attach images. The history (`invitation_sends`) is only recorded after the administrator's explicit confirmation and is append-only (a resend is a new record with a higher `attempt`).
4. **Invitations ≠ people.** An invitation is the row in `invitations`; people are adults + children aged 8–11 + children aged 0–7 from the RSVP. The dashboard computes everything from the database and shows both numbers separately.
5. **Authorization on the server.** Every API under `server/api/admin/**` calls `requireAdmin(event)`. The `admin` middleware only protects navigation; never trust it alone.
6. **Shared validation.** Zod schemas live in `shared/validation`; the server always revalidates. Client-side validation is a convenience only.
7. **Security by default.** No `v-html` with user data; queries only through Drizzle (parameterized); do not expose sequential IDs in public routes; do not log phone numbers, emails or messages; internal errors never reach the client. Login, RSVP and password changes are rate limited by IP and by scope (email/admin). HTML pages use a CSP with a per-request nonce, API responses use `default-src 'none'`, bodies are capped per route and uploads are validated by magic bytes.
8. **Controlled uploads.** Invitation image in `DATA_DIR/uploads`, accepting PNG/JPG/WebP up to 5 MB, served by `/api/invite-image/[name]`. The default artwork is `public/images/convite-luigi-marco.jpg`, with `public/images/convite-padrao.svg` as a fallback.
9. **No dead buttons or mocks in production.** The seed is development-only. Every visible action must actually work.
10. **Single instance.** Rate limiting is in memory and per process. If you scale horizontally, replace `server/utils/rate-limit.ts` with Redis before adding more replicas.
11. **Finance is derived, never stored twice.** A supplier is one `contracts` row with any number of `contract_payments`. Paid, open, scheduled and unallocated amounts plus payment/contract statuses are computed from `paid_on`/`due_date` in `shared/utils/finance.ts`; do not add status or balance columns. Money is integer cents (`shared/utils/money.ts`), date-only fields (`YYYY-MM-DD`) never go through the server timezone, and the server blocks installments above the contract balance and contract totals below the registered installments.

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
- Displayed dates use the utilities from `shared/utils/format.ts`; phone numbers go through `shared/utils/phone.ts` (E.164 via `libphonenumber-js`, with the country list in `shared/config/countries.ts`). WhatsApp links live in `shared/utils/whatsapp.ts` and receive the number already normalized.
- UI texts in pt-BR, with a welcoming and direct tone.

## Tests

- `tests/` covers phone numbers, messages, RSVP, limits, settings, password policy, request size, uploads, CSV import and the rate limiter.
- When you change a shared rule, update/add the corresponding test in the same PR.
- Prefer testing pure functions; for the database, validate in the dev environment.

## Git and GitHub Flow

`main` is always ready to deploy. No work goes directly into it.

1. Create a branch from `main`: `feat/…`, `fix/…`, `docs/…` or `chore/…`.
2. Make small, cohesive commits in the format `type: summary in the imperative` (e.g. `fix: ancora o link do convite no RSVP`).
3. Push early to the remote branch and open a PR describing the problem, the solution and how to verify it.
4. Answer the review with new commits on the same branch.
5. With tests/CI green, merge (squash); the branch is deleted automatically.
6. Deploy comes from `main`.

### Releases

`package.json` is the source of truth for the version, `CHANGELOG.md` records the changes and `/api/health` reports the version of the running image. To cut a release:

1. Create `chore/release-x.y.z` from `main`.
2. Move the `Unreleased` entries in `CHANGELOG.md` to the new version and update the date.
3. Run `npm version x.y.z --no-git-tag-version` to update `package.json` and the lockfile.
4. Open the PR and squash merge after the checks.
5. Tag the merge commit (`git tag -a vx.y.z -m "vx.y.z"`) and push the tag.

CI and documentation-only changes do not need a release. Bump `PATCH` for fixes, `MINOR` for new features and `MAJOR` for breaking changes. Never move or delete a published tag.

CI and publishing:

- `.github/workflows/ci.yml` runs lint, tests, typecheck and build, validates the image build on PRs and publishes to GHCR only after the checks pass (`main`, `v*.*.*` tags and manual dispatch). Do not merge with red checks.
- `main` is protected by a ruleset: a pull request is required, the `Testes, tipos e build` and `Build da imagem` checks must be green, only squash merges are allowed, force pushes and deletions are blocked, and merged branches are deleted automatically.
- `.github/pull_request_template.md` is the base for every PR description: problem, solution, how to verify and checklist.
- Tags `v*.*.*` follow Semantic Versioning and are the only way to create a release: the workflow publishes versioned images (`1.2.3`, `1.2` and `sha-<commit>`) and creates the GitHub Release with notes generated from the merged PRs. `latest` only follows `main`.
- `docker-compose.ghcr.yml` is the override that swaps the local build for the published image.

Never commit `.env`, `.data/`, `node_modules`, `.nuxt`, `.output` or build artifacts — `.gitignore` already covers those.

## Environment

- Dev database: `postgres://convite:convite@localhost:5433/convite_festa`.
- The dev Compose (`docker-compose.dev.yml`) is a separate project (`convite-festa-dev`) that only runs the database. Never combine it with `docker-compose.yml`.
- Seed admin: defined by `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` (minimum 12-character password, not one of the examples in `shared/utils/password-policy.ts`).
- Seed test invitation: `/convite/11111111-1111-4111-8111-111111111111`.
- The production image uses `node:22-bookworm-slim`. **Do not go back to Alpine** without retesting the client build (Rollup fails with `Code is nested too deeply`).
- The production Compose uses the `convite-festa` project, with the `convite-festa_convite_pgdata` and `convite-festa_convite_uploads` volumes.
- Behind HTTPS, the session cookie automatically becomes `Secure`; the reverse proxy is not part of the Compose file.
