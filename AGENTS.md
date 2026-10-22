<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:test-sprint-status -->
# Test Suite — All Epics

Merged to `master` (PRs #57–#61).

## Test Suite (333 passing)
- 36 Vitest test files, 333 unit/integration/component tests
- 4 Playwright spec files with 20 E2E tests

## E2E Tests (requires seeded DB + running dev server)
```bash
pnpm seed && pnpm test:e2e
```

## CI
`.github/workflows/ci.yml` runs lint, unit tests, build, and Playwright E2E
against a Postgres service on pushes and PRs to `master`.

## Remaining
- Technician seed email change (blocked on professor confirmation)
<!-- END:test-sprint-status -->
