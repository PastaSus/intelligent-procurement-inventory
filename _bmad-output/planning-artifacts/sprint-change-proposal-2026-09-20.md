# Sprint Change Proposal — Capstone Advisor Feature Additions

**Date:** 2026-09-20
**Author:** Administrator
**Change Scope:** Minor-Moderate (Direct Adjustment)
**Trigger:** Capstone Advisor post-sprint review recommended 4 new features

---

## 1. Issue Summary

After completing all 7 epics (245 tests passing), the Capstone Advisor recommended 4 new features during project review:

1. **Unit Relocation** — Move a computer unit to another room
2. **Component Relocation** — Move a component to another unit
3. **Reporting Feature** — Printable hardware inventory report
4. **Software/Application Inventory** — Track installed applications on units

These are additive features, not corrective changes. No existing functionality is broken or misaligned.

---

## 2. Impact Analysis

### Epic Impact

| Existing Epic | Impact | Notes |
|---------------|--------|-------|
| Epic 1: Schema Migration | None | No migration changes needed for features 1-3 |
| Epic 2: Room Management | None | — |
| Epic 3: Unit Management | **Partial** | Story 3.3 (Edit Unit) already allows room change in the edit form. Unit Relocation may already be functional. Verify before adding new story. |
| Epic 4: Component Tracking | **Minor** | Story 4.3 (Edit Component) currently only edits type/serial/specs/status. Need to add `computer_unit_id` to the edit form for relocation. |
| Epic 5: Spare Parts | None | — |
| Epic 6: Purchase Requests | None | — |
| Epic 7: Navigation | **Minor** | Need to add "Reports" nav item if new reporting page is created. |

### Artifact Impact

| Artifact | Impact | Action Needed |
|----------|--------|---------------|
| **PRD** | Low | Add FR33-FR36 for new features. Reporting already listed as Growth feature. Software Inventory is net-new. |
| **Architecture** | Medium | New Prisma model `InstalledApplication` for Feature 4. No other schema changes. |
| **Schema** | Medium | Add `InstalledApplication` model + migration. |
| **Sprint Status** | Low | Add new stories to tracking. |
| **Project Context** | Low | Update component types and patterns if needed. |

---

## 3. Recommended Approach: Direct Adjustment

### Rationale

- All 4 features are **additive** — no existing code needs to be reverted
- Features 1-2 are trivial (UPDATE queries on existing foreign keys)
- Feature 3 is a new page but no schema changes
- Feature 4 requires a new model but follows established CRUD patterns
- Total effort: ~8-10 new stories across 2 epics

---

## 4. Detailed Change Proposals

### Feature 1: Unit Relocation

**Analysis:** Story 3.3 (Edit Computer Unit) acceptance criteria states: *"user can modify unit name and laboratory room"*. This feature may **already be implemented**.

**Action:** Verify Story 3.3 implementation. If the edit form already includes a room dropdown, this feature is done. If not, add `laboratory_room_id` dropdown to the edit form.

**New story only if needed:**

```
Story 3.5: Relocate Computer Unit
As a lab technician,
I want to move a computer unit to a different room,
So that I can track physical relocations.

Acceptance Criteria:
- Given user is viewing the units list
- When user clicks "Relocate" on a unit
- Then system displays a modal with room dropdown
- And user selects target room
- And system validates unit_name + target room uniqueness
- And unit's laboratory_room_id is updated
- And user sees success toast notification
```

**Schema change:** None — `laboratory_room_id` foreign key already exists.

---

### Feature 2: Component Relocation

**New story:**

```
Story 4.7: Relocate Component to Another Unit
As a lab technician,
I want to move a component from one computer unit to another,
So that I can track hardware swaps between machines.

Acceptance Criteria:
- Given user is viewing a component list on a unit's detail page
- When user clicks "Relocate" on a component
- Then system displays a modal with target unit dropdown (shows unit name + room)
- And user selects target computer unit
- And system validates component type doesn't already exist on target unit (optional: warn but allow)
- And component's computer_unit_id is updated
- And user sees success toast notification
- And component list refreshes on both source and target pages
```

**Schema change:** None — `computer_unit_id` foreign key already exists.

---

### Feature 3: Printable Hardware Inventory Report

**New story:**

```
Story 8.1: Hardware Inventory Report Page
As a lab manager,
I want to view a printable hardware inventory report,
So that I can generate physical documentation for audits or planning.

Acceptance Criteria:
- Given user navigates to Reports page (new nav item)
- When page loads
- Then system displays a report with: all rooms, all units per room, all components per unit
- And report shows: room name, unit name, component type, serial number, specifications, status
- And report is grouped by room, then by unit
- And user can filter by room, status, or component type
- And page includes a "Print" button that triggers browser print dialog
- And print stylesheet hides nav/sidebar and formats report for A4 paper
- And report header shows: "Hardware Inventory Report" + generation date + total counts
```

```
Story 8.2: Report Summary Statistics
As a lab manager,
I want the report to include summary statistics,
So that I can see at-a-glance totals.

Acceptance Criteria:
- Given user is on the Reports page
- When report loads
- Then summary section shows: total rooms, total units, total components
- And breakdown by status: FUNCTIONAL count, NEEDS_REPAIR count, NEEDS_REPLACEMENT count
- And breakdown by component type: "X processors, Y memory modules, etc."
```

**Schema change:** None — read-only queries on existing tables.

---

### Feature 4: Software/Application Inventory

**Schema change required — new model:**

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

**Migration:** `prisma migrate dev --name add-installed-applications`

**New stories:**

```
Story 8.3: Add Installed Application to Unit
As a lab technician,
I want to record software installed on a computer unit,
So that I can track the complete asset profile of each machine.

Acceptance Criteria:
- Given user is viewing a computer unit's detail page
- When user clicks "Add Software" and fills in: name, version (optional), license key (optional), license type (dropdown), install date (optional)
- Then system saves the application record linked to the unit
- And user sees success toast notification
```

```
Story 8.4: View Installed Applications by Unit
As a lab technician,
I want to view all software installed on a specific computer unit,
So that I can see the complete software profile.

Acceptance Criteria:
- Given user navigates to a computer unit's detail page
- When page loads
- Then system displays all installed applications in a table
- And table shows: name, version, license type badge, install date
- And user can edit or remove individual applications
```

```
Story 8.5: Edit Installed Application
As a lab technician,
I want to edit application details,
So that I can update version numbers or license information.

Acceptance Criteria:
- Given user is viewing the software list for a unit
- When user clicks "Edit" on an application
- Then system displays pre-filled form with current values
- And user can modify: name, version, license key, license type, install date
- And updated_at is automatically set
```

```
Story 8.6: Remove Installed Application
As a lab technician,
I want to remove an application record,
So that I can account for uninstalled software.

Acceptance Criteria:
- Given user is viewing the software list for a unit
- When user clicks "Remove" on an application
- Then system shows confirmation dialog
- And upon confirmation, application record is permanently deleted
- And user sees success toast notification
```

**Navigation update:** Add "Software" as a sub-page under each unit's detail view (not a top-level nav item).

---

## 5. Implementation Handoff

### Scope Classification: **Minor-Moderate**

- Features 1-2: Minor — can be implemented directly by Developer agent
- Feature 3: Moderate — new page with print stylesheet
- Feature 4: Moderate — schema migration + new CRUD

### Proposed Story Sequence

| # | Story | Epic | Effort | Dependencies |
|---|-------|------|--------|--------------|
| 1 | Verify/Implement Unit Relocation (3.5) | Epic 3 | XS | None |
| 2 | Relocate Component (4.7) | Epic 4 | S | None |
| 3 | Schema Migration: InstalledApplication | Epic 8 | S | None |
| 4 | Add Software to Unit (8.3) | Epic 8 | S | Story 3 |
| 5 | View Software by Unit (8.4) | Epic 8 | S | Story 3 |
| 6 | Edit Software (8.5) | Epic 8 | XS | Story 3 |
| 7 | Remove Software (8.6) | Epic 8 | XS | Story 3 |
| 8 | Hardware Report Page (8.1) | Epic 8 | M | None |
| 9 | Report Summary Stats (8.2) | Epic 8 | S | Story 8 |

### Handoff Recipients

- **Developer Agent (bmad-dev-story):** Implement stories 1-9 in sequence
- **Test Architect (bmad-testarch-atdd):** Generate acceptance tests for new stories
- **Navigation update:** Add Reports nav item (Story 7.1 update)

### Success Criteria

- All 4 features functional and tested
- Existing 245 tests still passing
- Schema migration clean (no data loss)
- Print report renders correctly on A4
- Software inventory CRUD complete per unit

---

## 6. PRD Updates Required

### New Functional Requirements

```
### Asset Relocation

- FR33: Users can relocate a computer unit to a different laboratory room
- FR34: Users can relocate a component from one computer unit to another

### Reporting

- FR35: Users can view a printable hardware inventory report grouped by room and unit
- FR36: Users can filter reports by room, status, or component type
- FR37: Reports include summary statistics (totals by status and type)

### Software Inventory

- FR38: Users can add installed applications to a computer unit
- FR39: Users can view all software installed on a unit
- FR40: Users can edit application details (name, version, license)
- FR41: Users can remove application records from a unit
```

### Product Scope Update

| Level | Features |
|-------|----------|
| **MVP** | ...existing... + Unit/Component Relocation, Hardware Report |
| **Growth** | ...existing... + Software Inventory (moved from undefined to explicit) |

---

## Approval

- [x] **Approved** — Proceed with implementation ✅ (2026-09-20)
- [ ] **Revise** — Changes needed to proposal
- [ ] **Reject** — Do not implement

---

## Finalization

**Approved:** 2026-09-20
**Scope Classification:** Minor-Moderate (Direct Adjustment)
**Handoff:** Developer Agent (bmad-dev-story) for sequential story implementation
