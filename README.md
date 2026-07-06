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

Login endpoints accept `{ "name": "...", "password": "..." }`. Passwords are stored as bcrypt hashes.

Seeded crew leads:

- Ali
- Muthu
- Hock

All seeded crew leads use this initial password:

```text
password123
```

Passenger names are also login names, so active passenger names are unique case-insensitively. This means `Ada`, `ada`, and `ADA` cannot coexist while both accounts are active. A decommissioned passenger name may be reused for a new passenger.

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
- `PATCH /crew/resources/:id`
- `DELETE /crew/resources/:id`
- `PATCH /crew/resources/:id/reactivate`
- `GET /crew/reports/usage`
- `GET /crew/reports/by-level`
- `GET /crew/reports/top-resources`
- `GET /passengers/resources`
- `POST /passengers/resources/:id/use`
- `GET /passengers/usage`

Deleting a passenger is a soft delete: `DELETE /crew/passengers/:id` decommissions the account and preserves usage logs. Decommissioned passengers cannot log in and passenger-authenticated routes reject them with `403 { "error": "Account decommissioned" }`.

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

## Resources

Resources use free-text names rather than a fixed type enum. The migration seeds these spec resources:

- Food Station
- Sleeping Pod
- Basic Hygiene
- Private Cabin
- Advanced Medical Bay
- Luxury O2 Pod
- VIP Rec Deck

Crew leads can add, rename, decommission, and reactivate resources without schema changes.

## Client

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api/*` to the backend.

## AI Disclosure

This project was implemented with AI assistance. Architecture decisions, tests, and code were reviewed and adjusted to match the assessment plan and project constraints.
