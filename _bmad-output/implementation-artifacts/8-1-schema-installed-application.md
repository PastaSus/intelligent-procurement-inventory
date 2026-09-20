# Story 8.1: Schema Migration — InstalledApplication Model

Status: ready-for-dev

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
   - `license_type` (LicenseType enum, default NONE)
   - `install_date` (DateTime, optional)
   - `created_at` (DateTime, default now())
   - `updated_at` (DateTime, updatedAt)

2. **Given** the migration runs
   **Then** a new `LicenseType` enum is created with values: NONE, FREE, COMMERCIAL, OPEN_SOURCE, EDUCATIONAL

3. **Given** the migration runs
   **Then** cascade delete is configured: deleting a ComputerUnit removes its InstalledApplications
   **And** indexes exist on `computer_unit_id` and `name`

## Tasks / Subtasks

- [ ] Task 1: Add InstalledApplication model to Prisma schema (AC: 1, 2, 3)
  - [ ] Add `InstalledApplication` model to `prisma/schema.prisma`
  - [ ] Add `LicenseType` enum to `prisma/schema.prisma`
  - [ ] Add `installedApplications InstalledApplication[]` relation to `ComputerUnit` model
  - [ ] Configure cascade delete on relation
  - [ ] Add indexes on `computer_unit_id` and `name`

- [ ] Task 2: Generate and apply migration (AC: 1)
  - [ ] Run `prisma migrate dev --name add-installed-applications`
  - [ ] Verify migration SQL is correct
  - [ ] Run `prisma generate` to regenerate client

- [ ] Task 3: Update seed data (AC: 1)
  - [ ] Add sample InstalledApplication records to seed script
  - [ ] Add 2-3 apps per computer unit (e.g., "Windows 11", "Microsoft Office", "Google Chrome")

- [ ] Task 4: Verify migration (AC: 1, 2, 3)
  - [ ] Run existing tests to ensure nothing breaks
  - [ ] Verify new table exists in database
  - [ ] Verify cascade delete works

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
  license_type     LicenseType?  @default(NONE)
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
