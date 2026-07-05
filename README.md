# Spaceship X26 PRMS

Passenger Resource Management System for the Everest Engineering take-home assessment.

## Stack

- Node.js, TypeScript, Express
- PostgreSQL via `pg`
- Jest, ts-jest, Supertest
- Optional React client in `client/`

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run migrate
npm run dev
```

API health check:

```bash
curl http://localhost:3000/health
```

Run verification:

```bash
npm test
npm run build
```

## Authentication

The backend uses lightweight header-based identity for assessment scope:

- Crew routes require `x-crew-lead-id`
- Passenger routes require `x-passenger-id`

Login endpoints accept `{ "name": "...", "password": "..." }`. Because the schema intentionally has no password table, the password only needs to be present; the account is resolved by name.

Seeded crew leads:

- Commander Reyes
- Commander Singh
- Commander Park

## API

Core routes are available at both root paths and `/api` paths for the Vite client proxy:

- `POST /auth/crew/login`
- `POST /auth/passenger/login`
- `POST /crew/passengers`
- `GET /crew/passengers`
- `PATCH /crew/passengers/:id`
- `DELETE /crew/passengers/:id`
- `POST /crew/resources`
- `GET /crew/resources`
- `DELETE /crew/resources/:id`
- `GET /crew/reports/usage`
- `GET /crew/reports/by-level`
- `GET /crew/reports/top-resources`
- `GET /passengers/resources`
- `POST /passengers/resources/:id/use`
- `GET /passengers/usage`

## Architecture

The backend keeps responsibilities separated:

- Routes parse HTTP input and map service errors to responses.
- Services hold business rules and validation.
- Repositories contain SQL and map snake_case rows to camelCase domain objects.
- Middleware only authenticates and attaches the resolved entity to `res.locals`.
- Domain files define interfaces and enums.

Services receive stores via constructors, so unit tests mock repositories without touching PostgreSQL.

## Membership Access

Higher membership tiers inherit lower-tier resources:

- `SILVER`: silver resources
- `GOLD`: silver and gold resources
- `PLATINUM`: silver, gold, and platinum resources

The access map lives in `src/services/usageService.ts` and is reused by resource filtering.

## Client

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api/*` to the backend.

## AI Disclosure

This project was implemented with AI assistance. Architecture decisions, tests, and code were reviewed and adjusted to match the assessment plan and project constraints.
