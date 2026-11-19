# Birthday Invitation — Luigi & Marco Antonio

[![CI](https://github.com/pedronora/convite-festa/actions/workflows/ci.yml/badge.svg)](https://github.com/pedronora/convite-festa/actions/workflows/ci.yml)

A complete web application to manage guests, send invitations over WhatsApp and track RSVPs for **Luigi's (3 years old)** and **Marco Antonio's (1 year old)** birthday party.

The project has two areas:

- **Public site** (`/` and `/convite/[uuid]`): Spider-Man themed invitation, party details, countdown, RSVP and calendar/map actions.
- **Admin panel** (`/admin`): dashboard, guest management, individual link per UUID, send history, RSVPs, CSV export and party settings.

## Stack

- [Nuxt 4](https://nuxt.com/) + Vue 3 (Composition API) + strict TypeScript
- Tailwind CSS v4
- PostgreSQL 17 + [Drizzle ORM](https://orm.drizzle.team/)
- Zod for shared validation between client and server
- Own session store in the database, `scrypt` password hashing and `httpOnly` cookie
- Vitest for the shared business rules
- Docker and Docker Compose for development and production

## Requirements

- Node.js **22.22+** (22 LTS recommended)
- npm
- Docker + Docker Compose (for the local database or production)

## Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development PostgreSQL (port 5433)
docker compose -f docker-compose.dev.yml up -d

# 3. Create .env from the example file
cp .env.example .env
# Edit ADMIN_PASSWORD (at least 10 characters) before running the seed.

# 4. Apply migrations and load demo data
npm run db:migrate
npm run db:seed

# 5. Start the development server
npm run dev
```

Open:

- Public site: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin>
- Seed test invitation: <http://localhost:3000/convite/11111111-1111-4111-8111-111111111111>

### Seed administrator

The seed uses the `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables from `.env` (the password must have at least 10 characters). Set them before running `npm run db:seed`, for example:

```text
Email: admin@festa.local
Password: the one you set in ADMIN_PASSWORD
```

> These credentials are **development only**. Change the password at `/admin/configuracoes` or set different variables before seeding.

To create or reset an administrator without running the seed:

```bash
npm run admin:create -- --name "Ana" --email ana@exemplo.com --password "uma-senha-longa"
```

The command also accepts `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment. If the email already exists, the password is updated.

### Demo seed

`npm run db:seed` creates:

- the administrator defined in `.env`;
- the default party settings;
- 8 sample guests, with sends, confirmations and declines.

Set `SEED_SAMPLE=false` to create only the administrator and the settings. The seed never runs automatically in production.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | — | PostgreSQL connection string. Required. |
| `NUXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL used in the invitation links. No trailing slash. |
| `DATA_DIR` | `./.data` | Persistent folder for uploaded images. In production: `/app/data`. |
| `ADMIN_NAME` | `Administrador` | Name used by the seed/create-admin scripts. |
| `ADMIN_EMAIL` | `admin@festa.local` | Email used by the scripts. |
| `ADMIN_PASSWORD` | — | Initial password (at least 10 characters). |
| `SEED_SAMPLE` | `true` | Creates the sample guests during the seed. Use `false` in production. |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | Nitro server port and interface. |

`NUXT_DATABASE_URL` and `NUXT_DATA_DIR` are also accepted and take precedence at runtime; they are useful when the image is built without a `.env`.

## Database

```bash
npm run db:generate   # generates a migration from the Drizzle schema
npm run db:migrate    # applies pending migrations
npm run db:seed       # loads administrator, settings and sample data
npm run db:studio     # opens Drizzle Studio
```

The schema lives in `server/database/schema.ts` and the migrations in `drizzle/`.

The development PostgreSQL uses port **5433** to avoid clashing with local instances on 5432:

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down       # keeps the data
docker compose -f docker-compose.dev.yml down -v    # deletes the data
```

`docker-compose.dev.yml` is a **standalone** file: it only starts the development database, in its own Compose project (`convite-festa-dev`). Never combine it with `docker-compose.yml`. The production stack builds `DATABASE_URL` from `POSTGRES_PASSWORD`, while the development stack hardcodes the `convite` password, so a combined run ends in `password authentication failed for user "convite"`. With the app running on the host, keep `DATABASE_URL` using that same `convite:convite` pair.

## How the invitation works

1. The administrator registers the guest at `/admin/convidados`.
2. Each guest gets an **invitation** with its own UUID, used in the `/convite/[uuid]` link.
3. The administrator opens the send modal, reviews the message, downloads/attaches the invitation artwork and opens WhatsApp.
4. After actually sending it, the administrator marks the confirmation. Only then is the send recorded in the history, with phone number, message, method, status and attempt number.
5. The guest opens the link, sees the party details and accepts or declines the invitation.
6. The answer can be edited through the same link. The dashboard and the confirmations pages are always read from the database.

### WhatsApp limitations

This project **does not send messages automatically** and does not use the official WhatsApp API. It builds an `https://api.whatsapp.com/send?...` link and opens WhatsApp Web/app with the message ready.

- The actual send depends on the administrator tapping “send” in WhatsApp.
- The `api.whatsapp.com/send` link **cannot attach images**. The artwork must be downloaded/attached manually.
- The history is only recorded after the explicit confirmation in the UI.
- Resends create new records with an incremented `attempt`.
- Real automation would require integrating the WhatsApp Business Platform (official API), which is out of scope.

## Routes

### Public

| Route | Description |
| --- | --- |
| `/` | Public landing page with the party details and countdown. |
| `/convite/[uuid]` | Individual invitation and RSVP form. |
| `/api/public/party` | Public party settings. |
| `/api/public/invitations/[uuid]` | Individual invitation data. |
| `/api/public/invitations/[uuid]` (PUT) | Creates or updates the RSVP. |
| `/api/public/invitations/[uuid]/calendar` | `.ics` file for the calendar. |
| `/api/invite-image/[name]` | Serves the artwork uploaded in the admin panel. |

### Administrative

All of them require a valid session and are enforced on the server by `requireAdmin`.

| Route | Description |
| --- | --- |
| `/admin/login` | Admin panel login. |
| `/admin` | Dashboard with metrics and charts. |
| `/admin/convidados` | List, search, filters, sorting, bulk actions and CSV. |
| `/admin/convidados/[id]` | Details, editing, resend, link regeneration and deletion. |
| `/admin/envios` | Send and resend history. |
| `/admin/confirmacoes` | Answers, age groups and messages. |
| `/admin/configuracoes` | Party details, image, template, limit and password. |

## Business rules

- **Invitations and people are separate counts.** The dashboard shows sent/confirmed invitations separately from the total number of people (adults + children aged 8–11 + children aged 0–7).
- **One RSVP per invitation.** The answer can be edited; the send history is kept.
- **Separate age groups:** adults, children aged 8 to 11 and children aged 0 to 7.
- **A decline requires no people.** A positive confirmation must include at least one person.
- **People limit:** the guest's individual limit takes precedence over the default limit from the settings.
- **Phone numbers** are normalized to Brazilian E.164 (`55` + area code + number) and validated on both client and server.
- **Invitation links** use UUID v4 and do not allow enumerating guests.
- **Message and settings** are stored in the database and applied immediately on the public page.

## Party settings

At `/admin/configuracoes` you can change:

- birthday people and their ages;
- date/time and displayed labels;
- venue, address, neighborhood, city, state and map query;
- invitation image (PNG, JPG or WebP, up to 5 MB);
- WhatsApp message template (must contain `[LINK]`);
- RSVP intro text;
- success and decline messages;
- default people limit per invitation;
- administrator password.

Template placeholders: `[Nome]`, `[LINK]`, `[FESTA]`, `[DATA]`, `[HORARIO]`, `[LOCAL]`, `[ENDERECO]` and `[CIDADE]`.

The uploaded image is stored in `DATA_DIR/uploads` (a persistent volume in production) and served by `/api/invite-image/...`. The default artwork is `public/images/convite-luigi-marco.jpg`, with `public/images/convite-padrao.svg` as a fallback if the image fails to load.

## Tests and checks

```bash
npm run lint      # ESLint (@nuxt/eslint)
npm test          # Vitest: phone, messages, RSVP, limits and settings
npm run typecheck # vue-tsc / Nuxt typecheck
npm run build     # production build
npm run preview   # preview the build
```

The tests cover the shared pure rules. HTTP and database flows must be verified in the development environment or with a dedicated integration test. Node 22 is pinned in `.nvmrc` (ESLint 10 requires Node 21+).

## Docker deploy (production)

1. Copy the example file and adjust the values:

   ```bash
   cp .env.production.example .env
   ```

   Use a long password for `POSTGRES_PASSWORD` (avoid characters that need escaping in URLs, such as `@`, `:`, `/`, `#` and `%`) and set `APP_URL` to the real public URL, for example `https://convite.seudominio.com`.

   PostgreSQL only applies `POSTGRES_PASSWORD` when the volume is created for the first time. If you change it later, the existing data volume keeps the old password and the app fails with `password authentication failed`. In that case, either restore the original value or reset the volume with `docker compose down -v` (this deletes the data) and recreate the administrator.

2. Start the containers:

   ```bash
   docker compose up -d --build
   ```

3. Follow the startup:

   ```bash
   docker compose logs -f app
   ```

The application container applies the migrations automatically (`RUN_MIGRATIONS=true`) and then starts Nitro on port 3000. Compose publishes the port defined in `APP_PORT`.

4. Create the first administrator:

   ```bash
   docker compose exec app node scripts/create-admin.mjs \
     --name "Administrador" \
     --email admin@seudominio.com \
     --password "uma-senha-longa-e-unica"
   ```

5. Open `https://your-domain/admin` and sign in.

> In production, put the application behind an HTTPS reverse proxy (Caddy, Nginx, Traefik or your platform's proxy). The session cookie automatically switches to `Secure` when the request arrives over HTTPS. The reverse proxy is not part of this Compose file; use the one you prefer.

To disable automatic migrations, set `RUN_MIGRATIONS=false`. In that case, run `docker compose exec app node scripts/migrate.mjs` whenever you want.

### CI and the GHCR image

Two GitHub Actions workflows handle quality and distribution:

- **CI** (`.github/workflows/ci.yml`): on pull requests and pushes to `main`, runs tests, type checking and the build. On pull requests, it also validates the Docker image build without publishing.
- **Publish image** (`.github/workflows/publish.yml`): on every push to `main`, publishes `ghcr.io/pedronora/convite-festa` to the GitHub Container Registry. `v*.*.*` tags also produce versioned images.

Published tags:

| Tag | When |
| --- | --- |
| `latest` | push to `main` |
| `main` | push to `main` |
| `sha-<commit>` | every build |
| `1.2.3` and `1.2` | tag `v1.2.3` |

To run the published image, use the `docker-compose.ghcr.yml` override, which skips the local build:

```bash
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d
```

The image is public: `docker pull ghcr.io/pedronora/convite-festa:latest` works without logging in.

### Persistence

- `convite_pgdata`: PostgreSQL data.
- `convite_uploads`: uploaded images at `/app/data`.

Back up both volumes. Recreating containers without removing volumes keeps the data; `docker compose down -v` deletes everything.

## Backup and restore

### Database

```bash
# Compressed backup
docker compose exec -T db pg_dump -U convite -d convite_festa -Fc > backup-$(date +%F).dump

# Restore (overwrites existing objects)
cat backup-2026-11-18.dump | docker compose exec -T db pg_restore \
  -U convite -d convite_festa --clean --if-exists --no-owner
```

If the database credentials are different, adjust `-U` and `-d` or use the variables from `.env`.

### Uploaded images

```bash
docker run --rm \
  -v convite-festa_convite_uploads:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

To restore, replace `:ro` with `:rw` and run `tar xzf /backup/uploads-....tar.gz -C /data`.

> The volume name may differ if you changed the Compose `name` field. Check it with `docker volume ls`.

## Security

- Passwords are stored with `scrypt` and a random salt; never in plain text.
- Sessions last 7 days, are stored by SHA-256 hash and use an `httpOnly`, `SameSite=Lax` cookie, `Secure` under HTTPS.
- Every administrative API validates the session on the server, regardless of the route middleware.
- Administrative writes check the `Origin` against the request host.
- Inputs are validated with Zod on the server; the database uses parameterized queries through Drizzle.
- Vue escapes content by default; there is no `v-html` with guest data.
- Invitation routes, APIs and the admin panel send `X-Robots-Tag: noindex, nofollow`; the panel also has global security headers.
- Login, invitation reads, RSVP and password changes are rate limited.
- RSVP is limited per IP and per invitation, and does not reveal whether a UUID exists beyond what is necessary.
- Internal errors never return stack traces to the client.
- The CSV neutralizes spreadsheet formulas and uses UTF-8 with BOM and `;` as the delimiter.

### Rate limiting

The rate limiter is **in memory and per process**. That is enough for a single instance, which is the expected scenario for this party. If the application is scaled horizontally (multiple containers/processes), replace `server/utils/rate-limit.ts` with a shared store such as Redis.

## Project structure

```text
app/                  # pages, layouts, components and composables
  pages/
    convite/[uuid].vue
    admin/...
  components/
  composables/
server/
  api/                # Nitro endpoints
  database/           # Drizzle schema and client
  middleware/         # security headers
  plugins/            # global error log
  utils/              # auth, dashboard, queries, uploads, rate limit
shared/               # validation, types, config and utilities
drizzle/              # SQL migrations
scripts/              # seed, create-admin and migrate
tests/                # Vitest
docker/               # production entrypoint
```

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm run preview` | Previews the build. |
| `npm run typecheck` | Type checking for app and server. |
| `npm run lint` | ESLint check. |
| `npm run lint:fix` | ESLint with automatic fixes. |
| `npm test` | Vitest tests. |
| `npm run db:generate` | Generates a migration from the schema. |
| `npm run db:migrate` | Applies migrations. |
| `npm run db:push` | Syncs the schema directly (prototyping only). |
| `npm run db:seed` | Loads development data. |
| `npm run admin:create` | Creates/resets an administrator. |
| `npm run db:studio` | Opens Drizzle Studio. |

## Decisions and scope

- There is no mocked data in the application: everything is read from PostgreSQL. The seed is only a development convenience.
- There is no automatic WhatsApp sending, and no buttons without an action.
- Charts are custom SVG components (donut, bars and progress), with no heavy chart dependency.
- The default event is set to **January 23, 2027, at 3 PM**, at Recanto Família Fernandes, in Cascavel/PR. The date can be changed in the admin panel.
- The project does not include multiple image upload, guest segmentation by groups or email integration. Those can be added without changing the main model.
