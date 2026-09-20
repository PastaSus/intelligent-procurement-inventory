# Story 8.1: Schema Migration — InstalledApplication Model

Status: done

## Story

As a developer,
I want a new Prisma model for tracking installed applications on computer units,
so that we can inventory software alongside hardware.

## Acceptance Criteria

1. **Given** the developer runs `prisma migrate dev --name add-installed-applications`
   **Then** a new `InstalledApplication` table is created with columns:
   - `id` (String, cuid, primary key)
   - `computer_unit_id` (String, foreign key to ComputerUnit)
   - `name` (String, required)
   - `version` (String, optional)
   - `license_key` (String, optional)
   - `license_type` (LicenseType enum, required with DEFAULT NONE — avoids null handling)
   - `install_date` (DateTime, optional)
   - `created_at` (DateTime, default now())
   - `updated_at` (DateTime, updatedAt)

2. **Given** the migration runs
   **Then** a new `LicenseType` enum is created with values: NONE, FREE, COMMERCIAL, OPEN_SOURCE, EDUCATIONAL

3. **Given** the migration runs
   **Then** cascade delete is configured: deleting a ComputerUnit removes its InstalledApplications
   **And** indexes exist on `computer_unit_id` and `name`

## Tasks / Subtasks

- [x] Task 1: Add InstalledApplication model to Prisma schema (AC: 1, 2, 3)
  - [x] Add `InstalledApplication` model to `prisma/schema.prisma`
  - [x] Add `LicenseType` enum to `prisma/schema.prisma`
  - [x] Add `installedApplications InstalledApplication[]` relation to `ComputerUnit` model
  - [x] Configure cascade delete on relation
  - [x] Add indexes on `computer_unit_id` and `name`

- [x] Task 2: Generate and apply migration (AC: 1)
  - [x] Run `prisma migrate dev --name add-installed-applications`
  - [x] Verify migration SQL is correct
  - [x] Run `prisma generate` to regenerate client

- [x] Task 3: Update seed data (AC: 1)
  - [x] Add sample InstalledApplication records to seed script
  - [x] Add 2-3 apps per computer unit (e.g., "Windows 11", "Microsoft Office", "Google Chrome")

- [x] Task 4: Verify migration (AC: 1, 2, 3)
  - [x] Run existing tests to ensure nothing breaks
  - [x] Verify new table exists in database
  - [x] Verify cascade delete works

### Review Findings (Group 2 review, 2026-09-20)

- [x] [Review][Decision] Duplicate software names per unit — RESOLVED: allow repeats (free-text names + versions legitimately coexist; no UI invariant unlike component-type slots). No constraint added.
- [x] [Review][Patch] Align spec nullability text: story says `LicenseType?`, schema implements required + DEFAULT NONE (intentional — update story text to match)

## Dev Agent Record

### Completion Notes

**Implementation Complete:** Story 8.1 - Schema Migration (InstalledApplication)

**All Acceptance Criteria Satisfied:**
- AC1: `InstalledApplication` table created with all columns (id, computer_unit_id, name, version?, license_key?, license_type, install_date?, created_at, updated_at)
- AC2: `LicenseType` enum created (NONE, FREE, COMMERCIAL, OPEN_SOURCE, EDUCATIONAL)
- AC3: Cascade delete configured, indexes on computer_unit_id and name

**Design decision:** `license_type` is non-nullable with DEFAULT 'NONE' (instead of optional) to avoid null handling — NONE is the sensible default.

**Files Modified:**
- `prisma/schema.prisma` - Added InstalledApplication model, LicenseType enum, ComputerUnit relation

**Files Created (auto-generated):**
- `prisma/migrations/20260920091900_add_installed_applications/migration.sql`

**Files Modified (seed):**
- `prisma/seed.ts` - Added installedApplication cleanup + 3 sample apps per unit (Windows 11 Pro, Office 2021, Chrome)

**Verification:**
- Migration applied cleanly to Neon PostgreSQL
- Seed: 6 units × 3 apps = 18 InstalledApplication rows
- Cascade delete verified: deleting unit removes its 3 apps (tested, then re-seeded)
- TypeScript: no errors in schema/seed files
- Production build: succeeds

## Dev Notes

### Architecture Patterns to Follow

**Schema Pattern [Source: architecture.md#Data Architecture]**
- Schema location: `prisma/schema.prisma`
- Naming: snake_case for tables and columns
- Enums: PascalCase
- Foreign keys: `{referenced_model}_id`

**Migration Pattern [Source: architecture.md#Data Architecture]**
- Use `prisma migrate dev --name <migration_name>`
- Always verify migration SQL before applying

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | MODIFY | Add InstalledApplication model + LicenseType enum |
| `prisma/migrations/` | AUTO | Generated migration directory |
| `prisma/seed.ts` | MODIFY | Add sample software records |

### Database Schema

```prisma
model InstalledApplication {
  id               String        @id @default(cuid())
  computer_unit_id String
  name             String
  version          String?
  license_key      String?
  license_type     LicenseType   @default(NONE)
  install_date     DateTime?
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt
  computer_unit    ComputerUnit  @relation(fields: [computer_unit_id], references: [id], onDelete: Cascade)

  @@index([computer_unit_id])
  @@index([name])
}

enum LicenseType {
  NONE
  FREE
  COMMERCIAL
  OPEN_SOURCE
  EDUCATIONAL
}
```

**Relation update to ComputerUnit:**
```prisma
model ComputerUnit {
  # ... existing fields ...
  components            ComputerComponent[]
  installedApplications InstalledApplication[]  # ADD THIS
}
```

### Testing Standards

- Run `prisma migrate dev` — should succeed without errors
- Run `prisma db seed` — should include sample software
- Run existing test suite — no regressions
- Verify cascade delete: deleting a unit removes its software records

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 4: Software/Application Inventory
- [Source: architecture.md#Data Architecture] Schema patterns and naming conventions
- [Source: prisma/schema.prisma] Current schema with ComputerUnit model
