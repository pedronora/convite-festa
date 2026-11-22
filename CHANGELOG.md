# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
