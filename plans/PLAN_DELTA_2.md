# PRMS — Delta Plan 2
## Changes from PLAN_DELTA.md

---

## 1. Passenger Soft Delete

### Decision
Passengers not hard deleted. `is_active` flag added. "Delete" = decommission.
Mirrors resource decommission pattern. Unlike resources, passenger decommission is permanent — no reactivation.

### Rationale
Deleting passenger with usage logs violates FK constraint on `usage_logs.passenger_id`.
Audit trail (Level 3) must stay intact. Soft delete preserves logs.

### Schema change
```sql
ALTER TABLE passengers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

### New endpoints
```
DELETE /crew/passengers/:id
→ 200  { message: "Passenger decommissioned" }
→ 404  { error: "Passenger not found" }
→ 409  { error: "Passenger is already decommissioned" }

```

### Side effects
- `GET /crew/passengers` — return all passengers including inactive, show status badge
- `POST /auth/passenger/login` — only active passengers can log in, add `AND is_active = TRUE` to query
- `passengerAuth` middleware — reject inactive passenger with `403 { error: "Account decommissioned" }`

---

## 2. Passenger Name — Partial Unique Index (Active Only)

### Decision
Name unique among active passengers only. Allows name reuse after decommission.

### Rationale
Hard delete removed. Without partial index, decommissioned "Ali" blocks new "Ali" forever.
Case-insensitive match preserved.

### Schema change
```sql
-- Drop previous unique constraint if applied
-- Add partial unique index instead
CREATE UNIQUE INDEX unique_active_passenger_name
ON passengers (LOWER(name))
WHERE is_active = TRUE;
```

### Login query
```sql
-- Only match active passengers
SELECT * FROM passengers WHERE LOWER(name) = LOWER($1) AND is_active = TRUE
```

### Known limitation
Two passengers with same name cannot coexist while both active. Note in README.

---

## 3. Updated Passenger Repository

```typescript
findById(id: string): Promise<Passenger | null>
findAll(): Promise<Passenger[]>              // all, including inactive
findActiveByName(name: string): Promise<Passenger | null>  // for login
create(dto: CreatePassengerDTO): Promise<Passenger>
update(id: string, dto: UpdatePassengerDTO): Promise<Passenger>
decommission(id: string): Promise<Passenger>

```

---

## 4. Updated Passenger Service

```typescript
createPassenger(dto: CreatePassengerDTO): Promise<Passenger>
updatePassenger(id: string, dto: UpdatePassengerDTO): Promise<Passenger>
decommissionPassenger(id: string): Promise<Passenger>

getPassengerById(id: string): Promise<Passenger>
getAllPassengers(): Promise<Passenger[]>
```

Guards:
- `createPassenger` — 409 if active passenger with same name exists
- `updatePassenger` — 409 if name conflicts with another active passenger
- `decommissionPassenger` — 409 if already inactive

---

## 5. Updated Domain Type

```typescript
// src/domain/passenger.ts
export interface Passenger {
  id: string;
  name: string;
  membershipLevel: MembershipLevel;
  isActive: boolean;            // added
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6. Updated Test Cases

### passengerService.test.ts
```
- createPassenger creates with correct fields, isActive true by default
- createPassenger throws 409 on duplicate active name (case-insensitive)
- createPassenger allows same name if previous passenger is decommissioned
- createPassenger throws 400 if name, password or membershipLevel missing
- findById returns passenger correctly
- findById throws 404 when not found
- updatePassenger updates name
- updatePassenger updates membershipLevel
- updatePassenger throws 400 when no fields provided
- updatePassenger throws 404 when not found
- updatePassenger throws 409 on name conflict with another active passenger
- decommissionPassenger sets isActive false
- decommissionPassenger throws 404 when not found
- decommissionPassenger throws 409 when already inactive

```

---

## 7. Frontend Updates

### Crew dashboard — Passengers tab
- Show all passengers including inactive
- Add status badge (Active / Decommissioned) per row
- Decommission button when active — permanent, no reactivation
- Remove hard delete — no delete button

### Passenger dashboard
- No change

---

## 8. Frontend Error Handling

### Current gap
Crew dashboard swallows errors silently. Only login and resource use button have feedback.

### Fix — Global axios interceptor
Add response interceptor in `client/src/api/axios.ts`:
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || "Something went wrong";
    // emit to global error state
    return Promise.reject(new Error(message));
  }
);
```

### Fix — Toast/notification component
Create `client/src/components/Toast.tsx`:
- Floating top-right notification
- Auto-dismisses after 4 seconds
- Red for errors, green for success
- Accepts `{ message: string, type: "success" | "error" }`

### Fix — Global error state
In `App.tsx`, maintain toast state, pass setter down via props or context:
```typescript
const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
```

### Surfaces needed
Every API call in `CrewDashboard.tsx` and `PassengerDashboard.tsx` must:
- Catch axios error
- Extract `error.message` from interceptor
- Call `setToast({ message, type: "error" })`

Success feedback needed for:
- Passenger created, updated, decommissioned
- Resource provisioned, updated, decommissioned, reactivated
- Resource used (passenger dashboard)
