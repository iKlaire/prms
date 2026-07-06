# PRMS — Delta Plan
## Changes from PLAN.md

This file documents design decisions made after initial scaffolding.
Implement these on top of what PLAN.md specifies.

---

## 1. Resource Model — Free Text Name, No Type Enum

### Decision
- Drop `type` column and `resource_type` enum entirely
- Replace with `name` — free text, case-insensitive unique constraint
- One row per named resource. Leads manage freely.

### Rationale
Enum locked resource types to predefined list. Free text allows leads to
provision any resource ("Sleeping Pod A", "Sleeping Pod B") without schema changes.
Spec resources become seed data, not enum values.

### Schema changes
```sql
-- Drop enum and type column, add name column
ALTER TABLE resources DROP COLUMN type;
ALTER TABLE resources ADD COLUMN name VARCHAR(255) NOT NULL;
ALTER TABLE resources ADD CONSTRAINT unique_resource_name UNIQUE (LOWER(name));
DROP TYPE resource_type;
```

### Migration seed — predefined resources matching spec
```sql
INSERT INTO resources (name, minimum_level) VALUES
  ('Food Station',         'SILVER'),
  ('Sleeping Pod',         'SILVER'),
  ('Basic Hygiene',        'SILVER'),
  ('Private Cabin',        'GOLD'),
  ('Advanced Medical Bay', 'GOLD'),
  ('Luxury O2 Pod',        'PLATINUM'),
  ('VIP Rec Deck',         'PLATINUM')
ON CONFLICT DO NOTHING;
```

### Domain type update
```typescript
// src/domain/resource.ts — remove ResourceType enum entirely
export interface Resource {
  id: string;
  name: string;
  minimumLevel: MembershipLevel;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceDTO {
  name: string;
  minimumLevel: MembershipLevel;
}

export interface UpdateResourceDTO {
  name?: string;
  minimumLevel?: MembershipLevel;
}
```

---

## 2. Resource CRUD — Full Management

Leads can create, update, decommission, reactivate resources.

```
POST   /crew/resources
Body:  { name: string, minimumLevel: "SILVER"|"GOLD"|"PLATINUM" }
→ 201  Resource
→ 400  { error: "name and minimumLevel are required" }
→ 409  { error: "Resource with this name already exists" }

PATCH  /crew/resources/:id
Body:  { name?: string, minimumLevel?: "SILVER"|"GOLD"|"PLATINUM" }  ← at least one required
→ 200  Resource
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

---

## 3. Updated Resource Repository

```typescript
findById(id: string): Promise<Resource | null>
findAll(): Promise<Resource[]>
findAccessibleByLevel(level: MembershipLevel): Promise<Resource[]>
create(dto: CreateResourceDTO): Promise<Resource>
update(id: string, dto: UpdateResourceDTO): Promise<Resource>
decommission(id: string): Promise<Resource>
reactivate(id: string): Promise<Resource>
```

---

## 4. Updated Resource Service

```typescript
provisionResource(dto: CreateResourceDTO): Promise<Resource>
updateResource(id: string, dto: UpdateResourceDTO): Promise<Resource>
decommissionResource(id: string): Promise<Resource>
reactivateResource(id: string): Promise<Resource>
```

Guards:
- `provisionResource` — 409 if name already exists (case-insensitive)
- `updateResource` — at least one field required; 409 on name conflict
- `decommissionResource` — 409 if already inactive
- `reactivateResource` — 409 if already active

---

## 5. Crew Leads — Updated Names and Passwords

### Names
```sql
-- migrations/migrate.ts — update seed
INSERT INTO crew_leads (name, password) VALUES
  ('Ali',   <bcrypt hash of 'password123'>),
  ('Muthu', <bcrypt hash of 'password123'>),
  ('Hock',  <bcrypt hash of 'password123'>)
ON CONFLICT DO NOTHING;

-- Hash password123 at migration time using bcrypt.hashSync('password123', 10)
-- Do not store plaintext
```

### Password implementation
- Add `password` column to both `crew_leads` and `passengers` tables
- Hash with `bcrypt`, salt rounds 10
- Login endpoints return ID only — no token

```sql
ALTER TABLE crew_leads ADD COLUMN password VARCHAR(255) NOT NULL;
ALTER TABLE passengers ADD COLUMN password VARCHAR(255) NOT NULL;
```

### Passenger password
- Set on creation by crew lead
- `POST /crew/passengers` body adds `password` field
- Crew lead provides initial password; no self-service password change (out of scope)

### Login endpoints
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

## 6. Access Control — Dynamic DB-driven

`LEVEL_ACCESS` map handles tier inheritance only:
```typescript
const LEVEL_ACCESS: Record<MembershipLevel, MembershipLevel[]> = {
  [MembershipLevel.SILVER]:   [MembershipLevel.SILVER],
  [MembershipLevel.GOLD]:     [MembershipLevel.SILVER, MembershipLevel.GOLD],
  [MembershipLevel.PLATINUM]: [MembershipLevel.SILVER, MembershipLevel.GOLD, MembershipLevel.PLATINUM],
};
```

`resource.minimumLevel` comes from DB. Access check:
```typescript
const accessibleLevels = LEVEL_ACCESS[passenger.membershipLevel];
if (!accessibleLevels.includes(resource.minimumLevel)) {
  throw new Error("Access denied. Insufficient membership level");
}
```

---

## 7. Frontend Updates

### Crew dashboard — Resources tab
- Provision form: `name` text input + `minimumLevel` dropdown + Add button
- Per resource row: name, minimumLevel (editable dropdown), active badge
- Decommission button when active; Reactivate button when inactive
- No type display — name IS the label

### Crew dashboard — Passengers tab
- Add `password` field to create passenger form
- Placeholder: "Initial password"

### Passenger dashboard
- No change — resources display name directly, no formatting needed

---

## 8. Updated Test Cases

### resourceService.test.ts
```
- provisionResource creates resource correctly
- provisionResource throws 409 on duplicate name (case-insensitive)
- updateResource updates minimumLevel
- updateResource updates name
- updateResource throws when no fields provided
- updateResource throws 404 when not found
- decommissionResource sets isActive false
- decommissionResource throws 409 when already inactive
- reactivateResource sets isActive true
- reactivateResource throws 409 when already active
- decommission then reactivate restores correctly
```

### Remove from resourceService.test.ts
```
- isActive update (covered by decommission/reactivate tests above)
```

---

## 9. Expanded Passenger Service Tests

### passengerService.test.ts additions
```
- createPassenger creates with correct name, membershipLevel, password hashed
- createPassenger throws 409 on duplicate name (case-insensitive)
- createPassenger throws 400 if name, password or membershipLevel missing
- findById returns passenger correctly
- findById throws 404 when not found
- updatePassenger updates name
- updatePassenger updates membershipLevel
- updatePassenger throws 400 when no fields provided
- updatePassenger throws 404 when not found
- updatePassenger throws 409 on name conflict with another passenger
- deletePassenger removes correctly
- deletePassenger throws 404 when not found
```

---

## 10. Passenger Name — Unique and Case-Insensitive Login

### Unique constraint
Passenger name used as username. Case-insensitive unique constraint:
```sql
ALTER TABLE passengers ADD CONSTRAINT unique_passenger_name UNIQUE (LOWER(name));
```

### Login query
Case-insensitive match on both sides — "Ali", "ali", "ALI" all resolve to same user:
```sql
SELECT * FROM passengers WHERE LOWER(name) = LOWER($1)
```

Same applies to crew lead login:
```sql
SELECT * FROM crew_leads WHERE LOWER(name) = LOWER($1)
```

### Known limitation
Two passengers with genuinely same name cannot both exist. Note in README.

---

## 10. Entry/Exit — Rejected

Considered occupancy tracking. Rejected:
- Not in spec
- No capacity numbers defined
- Requires mutable reservation state — different data model
- Usage log is immutable audit record, not a session

Usage = log entry only. No exit endpoint.
