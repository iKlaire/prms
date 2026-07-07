# Spaceship X26 PRMS

Passenger Resource Management System for the Everest Engineering take-home assessment.

## Stack

- Node.js, TypeScript, Express
- PostgreSQL via `pg`
- Jest, ts-jest, Supertest
- Optional React client in `client/`

## Running Locally

Prerequisites:

- Node.js 20+
- Docker Desktop running

```bash
cp .env.example .env
docker compose up -d
npm install
npm run migrate
npm run dev
```

The backend runs on `http://localhost:3000`.

API health check:

```bash
curl http://localhost:3000/health
```

Run the React client in a second terminal:

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api/*` to the backend.

First crew login:

```text
Name: Ali
Password: password123
```

Useful local commands:

```bash
docker compose ps       # check Postgres container
docker compose down     # stop local Postgres
```

If Docker commands fail, open Docker Desktop first and wait until it reports that the engine is running.

Reset the local database:

```bash
docker compose down -v
docker compose up -d
npm run migrate
```

## Verification

```bash
npm test
npm run build
cd client && npm run build
```

GitHub Actions runs the same backend test/build and client build checks on pushes and pull requests to `main`.

## Authentication

The backend uses JWT bearer authentication:

- Login endpoints accept `{ "name": "...", "password": "..." }`.
- Successful login returns a signed JWT plus the authenticated user.
- Protected routes require `Authorization: Bearer <token>`.
- Middleware verifies the token, checks the expected role, loads the user from PostgreSQL, and rejects decommissioned passengers.

Passwords are stored as bcrypt hashes. `JWT_SECRET` is configured in `.env`; `.env.example` includes a placeholder that should be changed for any deployed environment.

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

## Production Considerations

This implementation is production-oriented in structure, but a few pieces are intentionally scoped for the assessment:

- JWTs are stored in `sessionStorage` for the demo client. A production web app should prefer secure, httpOnly cookies with CSRF protection where appropriate.
- The migration script is simple and idempotent for local setup. Production should use a migration tool with migration history and rollback support.
- Tests cover services and HTTP routes with mocked repositories. Production confidence would benefit from repository tests against a disposable PostgreSQL database.
- Observability is minimal. Production should add structured request logging, request IDs, metrics, and error reporting.
- `JWT_SECRET` must be changed from the `.env.example` placeholder and managed through deployment secrets.

## AI Disclosure

This project was implemented with AI assistance. Architecture decisions, tests, and code were reviewed and adjusted to match the assessment plan and project constraints.
