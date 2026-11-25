# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.1] - 2026-11-25

### Changed

- The logo emblem is now a stylized spider instead of the shield with eyes, and the favicon follows the same artwork. The wordmark, colors and logo variants are unchanged.

## [1.4.0] - 2026-11-24

### Added

- International phone numbers for guests and RSVPs, with a country selector in the forms and E.164 validation via `libphonenumber-js`. Brazilian, Argentine and US numbers have dedicated validation; other countries are supported by the selector. Brazil is the default and international numbers are selected explicitly.
- The phone country selector is a compact searchable dropdown with the flag and dial code; it searches by country name, ISO code or DDI and keeps Brazil, Argentina and the United States at the top.
- Phone display and CSV export now format Brazilian numbers nationally and other countries in the international format.

### Security

- Upgraded to Nuxt 4.7.0 and Vue 3.5.46, picking up the route-rule payload, catch-all encoded slash and development runtime-config fixes.

## [1.3.1] - 2026-11-24

### Fixed

- `/admin/financeiro` is now mobile-first: cards use compact padding on small screens, long supplier names wrap instead of being truncated, currency values use tabular figures and the upcoming payments rows no longer squeeze the name between the amount and the payment button.
- **Maiores saldos em aberto** and **Pagamentos recentes** stack on mobile — the amount gets its own line in the first and the whole row is tappable in the second — and the planned-vs-paid chart scrolls horizontally below `sm` so the axis labels stay legible.
- Contract list and contract detail follow the same rules: the status badge moved below the name, the three money columns fit 320 px and the installment actions wrap to their own row.

## [1.3.0] - 2026-11-23

### Added

- Expense control at `/admin/financeiro`: register suppliers and contracts (object, contracted value, contact and internal notes) with any number of installments, each with due date, optional paid date, payment method and notes.
- Financial dashboard with contracted/paid/open totals, overdue and due-soon alerts, budget breakdown between paid, scheduled and unallocated balance, category view, upcoming payments with quick payment, top open contracts, recent payments and a cumulative planned-vs-paid chart.
- Contract list with search, category and status filters, sorting, totals and quick payment; contract detail with installment management and payment history.
- `contracts` and `contract_payments` tables (money in integer cents, date-only due/paid fields) and the matching migration.
- 6 sample suppliers in the development seed covering paid, due soon, overdue and unallocated balances.

## [1.2.1] - 2026-11-21

### Fixed

- Standardized the height of the **Importar CSV**, **Exportar CSV** and **Novo convidado** buttons in the guests header; the export link now uses the same `AppButton` size as the other actions.

## [1.2.0] - 2026-11-21

### Added

- `[GRUPO]` placeholder in the WhatsApp message template. It renders the guest's family/group and falls back to the guest's name when no group is set.
- Bulk guest import from CSV at `/admin/convidados`, with required and optional headers, duplicate detection by normalized phone and a per-row result report (imported and skipped with reasons).

## [1.1.1] - 2026-11-21

### Changed

- The public invitation pre-fills the guest's phone and e-mail again. The link is personal: the guest decides whether to forward it, so the form saves the retyping introduced in 1.1.0.

## [1.1.0] - 2026-11-21

Security hardening release. No breaking changes for existing deployments, but the password policy and the public invitation payload changed.

### Added

- Content Security Policy with a per-request nonce on HTML pages and `default-src 'none'` on API responses.
- Per-route request body limits (128 KB for JSON, 6 MB for the image upload) and image validation by magic bytes.
- Per-email and per-admin rate limit scopes on top of the IP limit, with the trusted client IP taken from Cloudflare/proxy headers.
- `APP_BIND` in the production Compose to restrict the published port to the local reverse proxy.
- Shared password policy (minimum 12 characters, project examples rejected) used by the seed, `admin:create` and the password change form.

### Changed

- The public invitation payload no longer includes the guest's phone and e-mail; the RSVP form starts empty for them.
- Calendar links respect `APP_URL` with fallback to the request origin.
- Node requirement updated to `^22.22.3 || ^24.15.0 || >=26.0.0` and Nuxt to 4.6.4.

### Security

- Admin, invitation and API responses use `Cache-Control: no-store`, API responses no longer expose `x-powered-by` and HTML sends `Cross-Origin-Opener-Policy: same-origin`.

## [1.0.0] - 2026-11-20

First stable release: public invitation, RSVP and admin panel in production.

### Added

- Public landing page with party details, countdown, gallery and RSVP form.
- Individual invitation per guest UUID (`/convite/<uuid>`) with a link that opens directly on the RSVP form.
- Admin panel with login, dashboard, guests, WhatsApp send history, RSVPs, CSV export and party settings.
- Party settings stored in PostgreSQL and editable at `/admin/configuracoes` (celebrants, ages, date, venue, image, texts and default limit).
- RSVP with adults, children aged 8–11 and children aged 0–7, respecting the guest's individual limit or the default limit.
- WhatsApp link with the message ready (`api.whatsapp.com/send`), manual sending and append-only history with attempts.
- Invitation image upload (PNG/JPG/WebP up to 5 MB) stored in `DATA_DIR/uploads`.
- Open Graph/Twitter preview with public URL validation and fallback to the request origin.
- Calendar (`.ics`) download and map link for the venue.

### Security

- Server-side authorization on every `/api/admin/**` endpoint, `scrypt` password hashing and `httpOnly` session cookie.
- Rate limiting on login, RSVP and password changes; security headers; Zod validation re-executed on the server.
- CSV export neutralizes spreadsheet formulas and public routes never expose sequential IDs.

### Infrastructure

- Nuxt 4 build in a `node:22-bookworm-slim` image, PostgreSQL 17 and Drizzle migrations applied on the container entrypoint.
- Docker Compose for development and production, with persistent volumes for database and uploads.
- CI with lint, tests, type checking and build; GHCR image published only after the checks pass.
- Protected `main`, squash merges, automatic branch deletion and GitHub Releases created from tags.
