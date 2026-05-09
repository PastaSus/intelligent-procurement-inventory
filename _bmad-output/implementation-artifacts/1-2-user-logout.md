# Story 1.2: User Logout

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to log out of the system,
So that my session is securely terminated.

## Acceptance Criteria

1. **Given** user is logged in
   **When** user clicks logout button
   **Then** system destroys session
   **And** system clears HTTP-only cookie
   **And** system redirects to login page

2. **Given** user is logged in
   **When** user logs out
   **Then** session data is removed from server (cookie cleared)
   **And** user cannot access protected routes

## Tasks / Subtasks

- [x] Task 1: Create logout Server Action (AC: 1, 2)
  - [x] Add `logout()` to `app/_actions/auth.ts`
  - [x] Use `'use server'` directive
  - [x] Call `destroySession()` from `lib/auth.ts`
  - [x] Call `revalidatePath('/login')`
  - [x] Redirect to `/login`

- [x] Task 2: Create logout button in dashboard/layout (AC: 1)
  - [x] Created dashboard layout with auth check at `app/(dashboard)/layout.tsx`
  - [x] Created DashboardHeader component at `app/(dashboard)/components/DashboardHeader.tsx`
  - [x] Added logout button with useTransition() for pending state
  - [x] Button calls `logout()` Server Action

- [x] Task 3: Test logout flow (AC: 1, 2)
  - [ ] Verify logout button is visible in dashboard
  - [ ] Verify clicking logout destroys session
  - [ ] Verify redirects to login page
  - [ ] Verify cannot access protected routes after logout

## Dev Notes

### Architecture Patterns to Follow

**Server Action Pattern [Source: architecture.md#API & Communication Patterns]**

- Location: `app/_actions/auth.ts` (already exists from Story 1.1)
- Always use `'use server'` directive at top of file
- Return format: `{ success: boolean, data?: T, error?: string }`
- Call `revalidatePath()` after successful mutations
- Use Zod for input validation (if needed)

**Component Pattern [Source: architecture.md#Frontend Architecture]**

- Logout button: typically in header/navigation (Server or Client Component)
- If Client Component with `'use client'`, use `useTransition()` for pending state
- Redirect happens server-side after logout action

**Naming Conventions [Source: architecture.md#Naming Patterns]**

- Functions: `camelCase` (logout)
- Server Actions: Verb + noun (`logout`)

### Files to Create/Modify

| File                                        | Action | Purpose                                      |
| ------------------------------------------- | ------ | -------------------------------------------- |
| `app/_actions/auth.ts`                      | UPDATE | Add logout Server Action                     |
| `app/(dashboard)/layout.tsx` OR similar     | CREATE/UPDATE | Dashboard layout with logout button |
| `app/(dashboard)/header.tsx` (optional)     | CREATE | Header/navigation with logout button         |

### Database Requirements

None - uses existing session management from Story 1.1

### Testing Standards [Source: architecture.md#Testing Strategy]

**For MVP:** Manual testing sufficient

- Test logout button is visible
- Test logout destroys session cookie
- Test redirect to login works
- Test cannot access dashboard after logout

**Future (post-MVP):** Integration tests for logout flow

### Security Requirements [Source: prd.md#Non-Functional Requirements]

- NFR5: HTTP-only cookie cleared on logout
- NFR6: Protected routes inaccessible after logout

### Project Structure Alignment

```
app/
├── _actions/
│   └── auth.ts                    ← UPDATE: add logout()
├── (auth)/
│   └── login/
│       └── page.tsx               ← Already exists
└── (dashboard)/                   ← Protected by middleware.ts
    ├── layout.tsx                 ← CREATE/UPDATE: add logout button
    └── page.tsx                   ← May exist from Story 1.1 testing
```

## References

- [Source: epics.md#Story 1.2] User Logout story definition
- [Source: architecture.md#Authentication & Security] Session destruction pattern
- [Source: architecture.md#API & Communication Patterns] Server Actions pattern
- [Source: prd.md#Functional Requirements] FR26: Users can log out
- [Source: prd.md#Non-Functional Requirements] NFR5: HTTP-only cookies

## Dev Agent Record

### Agent Model Used

(To be filled after dev-story implementation)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled after implementation)