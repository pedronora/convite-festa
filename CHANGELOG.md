# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
