# Story 4.7: Relocate Component to Another Unit

Status: ready-for-dev

## Story

As a lab technician,
I want to move a component from one computer unit to another,
so that I can track hardware swaps between machines.

## Acceptance Criteria

1. **Given** user is viewing a component list on a unit's detail page
   **When** user clicks "Relocate" on a component
   **Then** system displays a modal with a target unit dropdown (shows unit name + room)

2. **Given** the relocate modal is open
   **When** user selects a target computer unit
   **And** clicks "Confirm Relocation"
   **Then** system updates the component's `computer_unit_id` to the target unit
   **And** system shows success toast notification
   **And** component list refreshes on the current page

3. **Given** user relocates a component
   **When** the target unit already has a component of the same type
   **Then** system shows a warning: "Target unit already has a [type]. Continue?"
   **And** user can confirm or cancel

## Tasks / Subtasks

- [ ] Task 1: Add "Relocate" button to component list UI (AC: 1)
  - [ ] Add a "Relocate" icon button (using `MoveRight` from lucide-react) next to Edit/Remove buttons in `ComponentsClient.tsx`
  - [ ] Pass `onRelocate` callback to each component row

- [ ] Task 2: Create RelocateComponentModal client component (AC: 1, 2, 3)
  - [ ] Create `app/dashboard/units/[id]/components/RelocateComponentModal.tsx`
  - [ ] Modal with target unit dropdown (fetch all units via props or server action)
  - [ ] Show target unit name + room in dropdown
  - [ ] Duplicate type warning check (AC: 3)
  - [ ] `useTransition` for pending state

- [ ] Task 3: Create server action for component relocation (AC: 2)
  - [ ] Add `relocateComponent(formData: FormData)` to `app/_actions/components.ts`
  - [ ] Validate: component exists, target unit exists, target unit not deleted
  - [ ] Check for duplicate type on target unit → return warning flag
  - [ ] Update `computer_unit_id` on the component
  - [ ] Call `revalidatePath()` for both source and target unit pages

- [ ] Task 4: Add Zod schema for relocation (AC: 2)
  - [ ] Add `RelocateComponentSchema` to `lib/validators/components.ts`
  - [ ] Fields: `componentId` (string, required), `targetUnitId` (string, required)

- [ ] Task 5: Wire up modal in ComponentsClient (AC: 1)
  - [ ] Add `showRelocateModal` state and `selectedComponent` state
  - [ ] Render `RelocateComponentModal` when open
  - [ ] Pass all units list as prop (fetch in parent page)

- [ ] Task 6: Update unit detail page to fetch all units (AC: 1)
  - [ ] In `app/dashboard/units/[id]/page.tsx`, fetch all active units for the relocate dropdown
  - [ ] Pass `allUnits` prop to `ComponentsClient`

## Dev Notes

### Architecture Patterns to Follow

**Server Action Pattern [Source: architecture.md#API & Communication Patterns]**
- Location: `app/_actions/components.ts`
- Always use `'use server'` directive
- Return format: `{ success: boolean, error?: string, warning?: string }`
- Call `revalidatePath()` after mutations

**Component Pattern [Source: architecture.md#Frontend Architecture]**
- RelocateComponentModal: Client Component with `'use client'`
- Use shadcn/ui: Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Co-locate: `app/dashboard/units/[id]/components/`

**Validation Pattern [Source: architecture.md#Implementation Patterns & Consistency Rules]**
- Server-side: Zod schema in `lib/validators/components.ts`
- Validate before database write

**Naming Conventions [Source: architecture.md#Naming Patterns]**
- Components: PascalCase (RelocateComponentModal.tsx)
- Functions: camelCase (relocateComponent)
- Server Actions: Verb + noun pattern

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/dashboard/units/[id]/components/RelocateComponentModal.tsx` | NEW | Relocate modal client component |
| `app/_actions/components.ts` | MODIFY | Add relocateComponent server action |
| `lib/validators/components.ts` | MODIFY | Add RelocateComponentSchema |
| `app/dashboard/units/[id]/ComponentsClient.tsx` | MODIFY | Add relocate button and modal state |
| `app/dashboard/units/[id]/page.tsx` | MODIFY | Fetch all units for dropdown |

### Database Requirements

**No schema change needed** — `ComputerComponent.computer_unit_id` foreign key already exists.

Prisma update operation:
```typescript
await prisma.computerComponent.update({
  where: { id: componentId },
  data: { computer_unit_id: targetUnitId },
});
```

### Testing Standards

- Test relocate button appears in component list
- Test modal opens with unit dropdown
- Test successful relocation updates component's unit
- Test duplicate type warning appears
- Test cancel does not change anything

## References

- [Source: epics.md#Story 4.7] Component Relocation feature from Sprint Change Proposal
- [Source: architecture.md#Data Architecture] ComputerComponent model with computer_unit_id FK
- [Source: prd.md#Functional Requirements] FR34: Users can relocate a component
- [Source: sprint-change-proposal-2026-09-20.md] Feature 2: Component Relocation
