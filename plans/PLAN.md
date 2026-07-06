# Spaceship X26: Passenger Resource Management System
## Implementation Plan

---

## Project Context

Take-home assessment for Everest Engineering. Build a PRMS allowing Crew Leads to manage
passengers and resources, and passengers to access permitted resources based on membership tier.

Evaluators look for: SOLID principles, TDD, clean architecture, design patterns, meaningful tests,
sensible commit history, production-ready code quality.

---

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL (via `pg` pool)
- **Testing**: Jest + ts-jest + Supertest
- **Local DB**: Docker Compose (Postgres 16, port 5432)

---

## Running the Project

```bash
cp .env.example .env
docker compose up -d        # start Postgres
npm install
npm run migrate             # run migrations + seed 3 crew leads
npm run dev                 # start dev server on port 3000
npm test                    # run all tests
```

---

## Database Schema

### Tables

```sql
crew_leads   (id UUID PK, name VARCHAR, created_at TIMESTAMPTZ)
passengers   (id UUID PK, name VARCHAR, membership_level ENUM, created_at, updated_at)
resources    (id UUID PK, name VARCHAR UNIQUE case-insensitive, minimum_level ENUM, is_active BOOL, created_at, updated_at)
usage_logs   (id UUID PK, passenger_id UUID FK, resource_id UUID FK, accessed_at TIMESTAMPTZ)
```

### Enums

```sql
membership_level: SILVER | GOLD | PLATINUM
resources are free-text names seeded from the spec examples
```

### Crew Leads
Exactly 3, seeded at migration time: Ali, Muthu, Hock. Fixed for the duration of the mission — spec states exactly 3, no requirement for dynamic crew lead management.

Enforcement strategy (application-layer, per spec's "system validation" language):
- No POST/DELETE endpoints exposed for crew leads
- Service layer validates crew lead ID exists before any privileged operation
- Seeding is the only way to add crew leads — intentional, not a gap

---

## Membership Tier Access

Higher tiers inherit all lower tier access. Resolve using this map:

```typescript
const LEVEL_ACCESS: Record<MembershipLevel, MembershipLevel[]> = {
  [MembershipLevel.SILVER]:   [MembershipLevel.SILVER],
  [MembershipLevel.GOLD]:     [MembershipLevel.SILVER, MembershipLevel.GOLD],
  [MembershipLevel.PLATINUM]: [MembershipLevel.SILVER, MembershipLevel.GOLD, MembershipLevel.PLATINUM],
};
```

Access check: passenger can use resource if `resource.minimumLevel` is in `LEVEL_ACCESS[passenger.membershipLevel]`.

This map lives in `src/services/usageService.ts`. Not in repository, not in route. Business rule = service layer.

---

## Authentication

Lightweight login plus header-based identity — intentional choice for assessment scope. No JWT, no session. Passwords are stored as bcrypt hashes and login returns only the resolved ID.

| Header | Used by | Validates against |
|---|---|---|
| `x-crew-lead-id` | Crew Lead routes | `crew_leads` table |
| `x-passenger-id` | Passenger routes | `passengers` table |

Middleware returns `403 { error: "Forbidden" }` if header missing or ID not found in DB.
Middleware attaches resolved entity to `res.locals.crewLead` or `res.locals.passenger`.

---

## API Endpoints

### Base URL: `http://localhost:3000`

### Health
```
GET /health
→ 200 { status: "ok", mission: "Spaceship X26 PRMS" }
```

---

### Auth Routes

```
POST /auth/crew/login
Body: { name: string, password: string }
→ 200 { crewLeadId: uuid }
→ 401 { error: "Invalid credentials" }

POST /auth/passenger/login
Body: { name: string, password: string }
→ 200 { passengerId: uuid }
→ 401 { error: "Invalid credentials" }
```

---

### Crew Routes — all require header `x-crew-lead-id: <uuid>`

#### Passengers
```
POST   /crew/passengers
Body:  { name: string, password: string, membershipLevel: "SILVER"|"GOLD"|"PLATINUM" }
→ 201  { id, name, membershipLevel, createdAt, updatedAt }
→ 400  { error: "Name and membershipLevel are required" }

GET    /crew/passengers
→ 200  Passenger[]

PATCH  /crew/passengers/:id
Body:  { name?: string, membershipLevel?: "SILVER"|"GOLD"|"PLATINUM" }  ← at least one required
→ 200  { id, name, membershipLevel, createdAt, updatedAt }
→ 400  { error: "At least one field required" }
→ 404  { error: "Passenger not found" }

DELETE /crew/passengers/:id
→ 204  (no body)
→ 404  { error: "Passenger not found" }
```

#### Resources
```
POST   /crew/resources
Body:  { name: string, minimumLevel: MembershipLevel }
→ 201  { id, name, minimumLevel, isActive, createdAt, updatedAt }
→ 400  { error: "name and minimumLevel are required" }

PATCH  /crew/resources/:id
Body:  { name?: string, minimumLevel?: MembershipLevel }
→ 200  { id, name, minimumLevel, isActive, createdAt, updatedAt }
→ 400  { error: "At least one field required" }
→ 404  { error: "Resource not found" }
→ 409  { error: "Resource with this name already exists" }

DELETE /crew/resources/:id
→ 200  { message: "Resource decommissioned" }
→ 404  { error: "Resource not found" }
→ 409  { error: "Resource is already decommissioned" }

PATCH  /crew/resources/:id/reactivate
→ 200  { message: "Resource reactivated" }
→ 404  { error: "Resource not found" }
→ 409  { error: "Resource is already active" }
```

#### Reports (Level 3)
```
GET    /crew/reports/usage
→ 200  UsageLogWithDetails[]   ← all logs, joined with passenger + resource names

GET    /crew/reports/by-level
→ 200  AggregatedUsage[]       ← grouped by membership_level, total usage + unique passengers

GET    /crew/reports/top-resources
→ 200  ResourceUsageCount[]    ← resources ordered by usage_count DESC
```

---

### Passenger Routes — all require header `x-passenger-id: <uuid>`

```
GET    /passengers/resources
→ 200  Resource[]              ← filtered to passenger's accessible tier, is_active = true only

POST   /passengers/resources/:id/use
→ 201  { message: "Resource accessed", log: UsageLog }
→ 403  { error: "Access denied. Insufficient membership level" }
→ 404  { error: "Resource not found" }
→ 410  { error: "Resource is decommissioned" }

GET    /passengers/usage
→ 200  UsageLogWithDetails[]   ← own history only
```

---


## Frontend (Bonus)

Simple React client in `/client`. Not part of core evaluation — demonstrates end-to-end system.

Stack: Vite + React + TypeScript + Tailwind + Axios

### Pages
- `/` — Login page. Toggle crew lead / passenger role, name + password form
- `/crew` — Crew dashboard. Tabs: Passengers, Resources, Reports
- `/passenger` — Passenger dashboard. Tabs: Resources (with Use button), History

### Auth flow
Login → backend returns ID → stored in `sessionStorage` → axios interceptor injects header on every request

### Running client
```bash
cd client
npm install
npm run dev     # http://localhost:5173
```

Vite proxies `/api/*` → `http://localhost:3000` so no CORS issues locally.

---

## Architecture

### Layer Responsibilities — strict, no crossover

```
Routes      → parse req, call service, return res. No business logic. No SQL.
Services    → business rules, validation, orchestration. No SQL. No req/res.
Repositories→ SQL only. No business logic. Returns domain types.
Middleware  → auth only. Attaches entity to res.locals.
Domain      → interfaces and enums only. Zero logic.
```

### Dependency Injection

Services receive repositories via constructor. Never instantiate inside:

```typescript
// CORRECT
class UsageService {
  constructor(
    private usageLogRepo: UsageLogRepository,
    private passengerRepo: PassengerRepository,
    private resourceRepo: ResourceRepository,
  ) {}
}

// WRONG — breaks testability
class UsageService {
  private usageLogRepo = new UsageLogRepository();
}
```

### Error Handling

Services throw typed errors. Routes catch and map to HTTP codes:

```typescript
// services throw plain errors with descriptive messages
throw new Error("Passenger not found");
throw new Error("Access denied. Insufficient membership level");
throw new Error("Resource is decommissioned");

// routes catch and map
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes("not found")) return res.status(404).json({ error: err.message });
    if (err.message.includes("Access denied")) return res.status(403).json({ error: err.message });
    if (err.message.includes("decommissioned")) return res.status(410).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
}
```

### Response shape — always consistent
```typescript
// success
res.status(200).json(data)

// error
res.status(4xx).json({ error: "Descriptive message" })
```

---

## File Structure

```
prms/
├── src/
│   ├── config/
│   │   └── db.ts                     ✅ done — pg pool
│   ├── domain/
│   │   ├── passenger.ts              ✅ done — Passenger, MembershipLevel, DTOs
│   │   ├── resource.ts               ✅ done — Resource, free-text resource DTOs
│   │   └── usageLog.ts               ✅ done — UsageLog, AggregatedUsage, etc.
│   ├── repositories/
│   │   ├── passengerRepository.ts    ✅ done
│   │   ├── resourceRepository.ts     ✅ done
│   │   └── usageLogRepository.ts     ✅ done
│   ├── services/
│   │   ├── passengerService.ts       ✅ done
│   │   ├── resourceService.ts        ✅ done
│   │   └── usageService.ts           ✅ done — tier inheritance logic lives here
│   ├── middleware/
│   │   └── auth.ts                   ✅ done — crewLeadOnly + passengerAuth
│   ├── routes/
│   │   ├── crewRoutes.ts             ✅ done
│   │   └── passengerRoutes.ts        ✅ done
│   └── app.ts                        ✅ done — routes mounted
├── tests/
│   ├── usageService.test.ts          ✅ done
│   ├── passengerService.test.ts      ✅ done
│   ├── resourceService.test.ts       ✅ done
│   └── routes.test.ts                ✅ done — integration via supertest
├── migrations/
│   └── migrate.ts                    ✅ done — full schema + 3 crew leads seeded
├── PLAN.md                           ✅ this file
├── docker-compose.yml                ✅ done
├── .env.example                      ✅ done
├── jest.config.ts                    ✅ done
├── tsconfig.json                     ✅ done
├── README.md                         ✅ done
└── package.json                      ✅ done
```

---

## Build Order (commit per step)

1. `repositories` — passengerRepository, resourceRepository, usageLogRepository
2. `services` — passengerService, resourceService, usageService (with LEVEL_ACCESS map)
3. `middleware` — crewLeadOnly, passengerAuth
4. `routes` — crewRoutes, passengerRoutes; wire into app.ts
5. `tests` — unit tests with mocked repos, integration tests with supertest
6. `README.md` — setup guide, architecture notes, AI disclosure

---

## Test Requirements

Coverage target: >80% across all service files.

Use Jest mocks for repositories in unit tests — no real DB calls:

```typescript
const mockPassengerRepo = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  updateMembership: jest.fn(),
  delete: jest.fn(),
};
```

### Required test cases

**usageService.test.ts**
- SILVER passenger cannot access GOLD resource → throws "Access denied"
- SILVER passenger cannot access PLATINUM resource → throws "Access denied"
- GOLD passenger can access SILVER resource (inheritance works)
- PLATINUM passenger can access all resource levels
- Decommissioned resource → throws "Resource is decommissioned"
- Non-existent resource → throws "Resource not found"
- Non-existent passenger → throws "Passenger not found"
- Successful use → creates usage log

**passengerService.test.ts**
- Create passenger returns correct shape
- findById non-existent → throws "Passenger not found"
- updateMembership non-existent → throws "Passenger not found"

**resourceService.test.ts**
- Provision resource returns correct shape
- Decommission sets isActive false
- findAccessibleByLevel SILVER returns only SILVER resources
- findAccessibleByLevel GOLD returns SILVER + GOLD resources
- findAccessibleByLevel PLATINUM returns all

---

## Conventions

- `async/await` throughout, no callbacks
- All DB queries use parameterised statements (`$1, $2` — never string interpolation)
- camelCase in TypeScript, snake_case in DB columns
- Repositories map snake_case columns to camelCase on return
- No `any` types
- Content-Type: `application/json` on all responses
