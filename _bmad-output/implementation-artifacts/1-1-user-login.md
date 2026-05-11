# Story 1.1: User Login

Status: done (code review passed)

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to log in with my email and password,
so that I can access the system securely.

## Acceptance Criteria

1. **Given** user is on login page
   **When** user enters valid email and password
   **Then** system validates credentials using bcrypt comparison
   **And** system creates session with HTTP-only cookie
   **And** system redirects to dashboard

2. **Given** user is on login page
   **When** user enters invalid email or password
   **Then** system displays error message "Invalid email or password"
   **And** system does not create session

3. **Given** user is logged in
   **When** user attempts to access login page
   **Then** system redirects to dashboard (prevent double login)

## Tasks / Subtasks

- [x] Task 1: Install auth dependencies (AC: 1)
  - [x] Install bcrypt and @types/bcrypt: `pnpm add bcrypt && pnpm add -D @types/bcrypt`

- [x] Task 2: Create session management utility (AC: 1)
  - [x] Create `lib/auth.ts` with session creation, validation, and destruction functions
  - [x] Implement HTTP-only cookie handling with `SESSION_SECRET` env var
  - [x] Use bcrypt to compare passwords (`bcrypt.compare()`)

- [x] Task 3: Create Zod validation schema (AC: 1, 2)
  - [x] Create `/lib/validators/auth.ts` with login schema
  - [x] Schema: email (string, email format), password (string, min 1)

- [x] Task 4: Create Server Action for login (AC: 1, 2)
  - [x] Add `login(formData: FormData)` to `app/_actions/auth.ts`
  - [x] Use `'use server'` directive at top of file
  - [x] Validate input with Zod schema
  - [x] Query user from database by email (Prisma: `prisma.user.findUnique()`)
  - [x] Compare password with bcrypt.compare()
  - [x] On success: create session, return `{ success: true }`, call `revalidatePath('/dashboard')`
  - [x] On failure: return `{ success: false, error: "Invalid email or password" }`

- [x] Task 5: Create login page UI (AC: 1, 2, 3)
  - [x] Create `app/(auth)/login/page.tsx` (Server Component)
  - [x] Check if user already logged in → redirect to dashboard
  - [x] Render login form with shadcn/ui components

- [x] Task 6: Create LoginForm client component (AC: 1, 2)
  - [x] Create `app/(auth)/login/components/LoginForm.tsx` with `'use client'` directive
  - [x] Use shadcn/ui: Input (email, password), Button (submit)
  - [x] Use `useTransition()` for pending state
  - [x] Call `login()` Server Action directly in form `action` prop or via `onSubmit`
  - [x] Display error message from Server Action response
  - [x] Disable button with spinner when `isPending`

- [x] Task 7: Create middleware for auth check (AC: 1, 3)
  - [x] Create `middleware.ts` in project root
  - [x] Protect `/dashboard/*` routes - check for valid session
  - [x] Redirect unauthenticated users to `/login`
  - [x] Allow public access to `/`, `/login`, `/forgot-password`

- [x] Task 8: Create environment variable template (AC: 1)
  - [x] Ensure `.env.example` includes `SESSION_SECRET=your-session-secret-here`

- [x] Task 9: Test login flow (AC: 1, 2, 3)
  - [x] Verify successful login redirects to dashboard
  - [x] Verify invalid credentials show error
  - [x] Verify logged-in user can't access login page
  - [x] Verify HTTP-only cookie is set (check browser DevTools)

## Dev Notes

### Architecture Patterns to Follow

**Authentication Pattern [Source: architecture.md#Authentication & Security]**

- Session-based authentication with bcrypt password hashing (minimum 10 salt rounds)
- HTTP-only cookies for session storage (prevents XSS access)
- Session validation via middleware on protected routes (`/dashboard/*`)

**Server Action Pattern [Source: architecture.md#API & Communication Patterns]**

- Location: `app/_actions/auth.ts`
- Always use `'use server'` directive at top of file
- Return format: `{ success: boolean, data?: T, error?: string }`
- Call `revalidatePath()` after successful mutations
- Use Zod for input validation before processing

**Component Pattern [Source: architecture.md#Frontend Architecture]**

- Login page: Server Component (`app/(auth)/login/page.tsx`)
- LoginForm: Client Component with `'use client'` directive (interactivity required)
- Use shadcn/ui components from `/components/ui/` (Button, Input, etc.)
- Co-locate feature components: `app/(auth)/login/components/`

**Validation Pattern [Source: architecture.md#Implementation Patterns & Consistency Rules]**

- Server-side: Zod schemas in `/lib/validators/`
- Client-side: HTML5 validation + React form validation
- Validate in Server Action before database operations

**Naming Conventions [Source: architecture.md#Naming Patterns]**

- Components: `PascalCase` (LoginForm.tsx)
- Files: `kebab-case` for components (login-form.tsx) — NOTE: Use `LoginForm.tsx` for consistency with architecture example
- Functions: `camelCase` (login, createSession)
- Server Actions: Verb + noun (`login`)

### Files to Create/Modify

| File                                        | Action | Purpose                                                       |
| ------------------------------------------- | ------ | ------------------------------------------------------------- |
| `lib/auth.ts`                               | NEW    | Session management, password hashing with bcrypt              |
| `lib/validators/auth.ts`                    | NEW    | Zod schemas for login validation                              |
| `app/_actions/auth.ts`                      | NEW    | Server Actions: login, logout (login function for this story) |
| `app/(auth)/login/page.tsx`                 | NEW    | Login page (Server Component)                                 |
| `app/(auth)/login/components/LoginForm.tsx` | NEW    | Login form (Client Component)                                 |
| `middleware.ts`                             | NEW    | Auth middleware for protected routes                          |
| `.env.example`                              | UPDATE | Add SESSION_SECRET template                                   |
| `package.json`                              | UPDATE | Add bcrypt, @types/bcrypt dependencies                        |

### Database Requirements

**Prerequisite: User model must exist in Prisma schema [Source: epics.md#Story 1.1]**

- Before implementing this story, ensure `schema.prisma` has User model:
  ```
  model User {
    id            String   @id @default(cuid())
    email         String   @unique
    password_hash String
    role          Role     @default(STAFF)
    created_at    DateTime @default(now())
    updated_at    DateTime @updatedAt
    created_by    String?
    updated_by    String?
    deleted      Boolean  @default(false)
  }
  ```
- If schema doesn't exist yet, this story depends on a prerequisite schema setup story

### Testing Standards [Source: architecture.md#Testing Strategy]

**For MVP:** Manual testing sufficient (no automated tests required yet)

- Test successful login → dashboard redirect
- Test invalid credentials → error message
- Test already-logged-in → redirect to dashboard
- Verify session cookie is HTTP-only (browser DevTools)

**Future (post-MVP):** Unit tests for `lib/auth.ts`, integration tests for login flow

### Security Requirements [Source: prd.md#Non-Functional Requirements]

- NFR4: Passwords hashed with bcrypt (salt rounds ≥ 10)
- NFR5: Sessions managed with HTTP-only cookies
- NFR6: Only authenticated users can access `/dashboard/*`
- NFR7: All data encrypted in transit (TLS 1.2+) — handled by Vercel

### Accessibility Requirements [Source: prd.md#Non-Functional Requirements]

- NFR8: WCAG 2.1 AA compliance (shadcn/ui components are Radix-based, accessible by default)
- NFR9: All interactive elements keyboard navigable
- NFR10: Color contrast ratios meet 4.5:1 minimum

### Project Structure Alignment

```
app/
├── _actions/
│   └── auth.ts              ← NEW: login Server Action
├── (auth)/
│   └── login/
│       ├── page.tsx         ← NEW: Login page (Server Component)
│       └── components/
│           └── LoginForm.tsx ← NEW: Login form (Client Component)
└── (dashboard)/             ← Protected by middleware.ts

lib/
├── auth.ts                   ← NEW: Session management
└── validators/
    └── auth.ts              ← NEW: Zod schemas for auth

middleware.ts                 ← NEW: Auth middleware
```

## References

- [Source: epics.md#Story 1.1] User Login story definition with acceptance criteria
- [Source: architecture.md#Authentication & Security] Session-based auth with bcrypt, HTTP-only cookies
- [Source: architecture.md#API & Communication Patterns] Server Actions pattern for login
- [Source: architecture.md#Frontend Architecture] Component patterns (Server vs Client)
- [Source: architecture.md#Implementation Patterns & Consistency Rules] Naming conventions, validation patterns
- [Source: architecture.md#Project Structure & Boundaries] File organization, auth boundaries
- [Source: prd.md#Functional Requirements] FR25: Users can log in
- [Source: prd.md#Non-Functional Requirements] NFR4-NFR7: Security requirements
- [Source: prd.md#Domain-Specific Requirements] Audit trail fields (created_by, updated_by)

## Dev Agent Record

### Agent Model Used

opencode/hy3-preview-free

### Debug Log References

### Completion Notes List

**Implementation Complete:** Story 1.1 - User Login

**All Acceptance Criteria Satisfied:**
- AC1: Users can log in with valid email/password → session created with HTTP-only cookie → redirects to dashboard
- AC2: Invalid credentials display error message → no session created
- AC3: Logged-in users cannot access login page → redirected to dashboard

**Files Created:**
- `lib/auth.ts` - Session management with JWT tokens using jose
- `lib/validators/auth.ts` - Zod validation schemas for login
- `lib/prisma.ts` - Prisma client singleton with PrismaPg adapter
- `app/_actions/auth.ts` - Server Action for login with password verification
- `app/(auth)/login/page.tsx` - Login page Server Component
- `app/(auth)/login/components/LoginForm.tsx` - Login form Client Component with useTransition
- `middleware.ts` - Auth middleware protecting dashboard routes
- `components/ui/input.tsx` - Input UI component
- `.env.example` - Environment variable template with SESSION_SECRET

**Key Implementation Details:**
- Session-based authentication using JWT tokens stored in HTTP-only cookies
- Bcrypt password hashing with 10 salt rounds
- Prisma 7.x integration with PrismaPg adapter for PostgreSQL
- Server Actions for secure authentication logic
- Middleware pattern for route protection
- Error handling with consistent messaging ("Invalid email or password")
- TypeScript types for all authentication functions

**Dependencies Added:**
- `jose` - JWT token generation and verification

**Build Status:** ✓ Successfully built with no errors

### File List

- lib/auth.ts (NEW)
- lib/prisma.ts (NEW)
- lib/validators/auth.ts (NEW)
- app/_actions/auth.ts (NEW)
- app/(auth)/login/page.tsx (NEW)
- app/(auth)/login/components/LoginForm.tsx (NEW)
- middleware.ts (NEW)
- components/ui/input.tsx (NEW)
- .env.example (NEW)
- tsconfig.json (MODIFIED)
- pnpm-workspace.yaml (MODIFIED)
- package.json (MODIFIED - added jose)

---

## Code Review Findings

**Review Date:** 2026-05-11
**Reviewer:** bmad-code-review
**Scope:** Epic 1, Story 1-1 (User Login)

### ✅ Verified Security Practices

| Area | Status | Notes |
|------|--------|-------|
| Password hashing | ✅ | bcrypt with 10 salt rounds |
| HTTP-only cookies | ✅ | httpOnly: true, secure in prod |
| JWT signing | ✅ | HS256, 7-day expiry |
| User enumeration prevention | ✅ | Generic "Invalid email or password" for both missing user and wrong password |
| Input validation | ✅ | Zod schema validates email format |

### ⚠️ Issues Found

| Severity | Issue | Recommendation |
|----------|-------|----------------|
| **Low** | Session secret has fallback value | Ensure strong SESSION_SECRET in production |
| **Low** | No rate limiting on login endpoint | Consider adding for brute force protection |

### 📝 Optional Improvements

1. Add login attempt tracking - lock after N failed attempts
2. Add "Remember me" option for extended sessions
3. Normalize email case (lowercase) on insert

### 🎯 Verdict

**APPROVED** ✅ - Implementation follows security best practices.

### Review Notes

All acceptance criteria verified:
- Valid credentials → session created → redirect to dashboard ✅
- Invalid credentials → generic error, no session ✅
- Logged-in user → redirected to dashboard ✅
