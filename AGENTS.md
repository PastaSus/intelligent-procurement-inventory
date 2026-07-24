<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:test-sprint-status -->
# Test Sprint — All Epics ATDD

Branch: `test/all-epics-atdd`

## Commit History
1. `7af0f9e` — test design docs (architecture + 7 per-epic + ATDD checklist)
2. `9229a86` — mocks/factories + 72 unit tests
3. `be98ef3` — 84 server action integration tests
4. `7cc9e0d` — 54 component/UI tests
5. `305cbb1` — 20 Playwright E2E smoke tests

## Test Suite (245 passing, 1 pre-existing failure)
- 28 Vitest test files (27 pass, AIChat.test.tsx fails — pre-existing)
- 4 Playwright spec files with 20 E2E tests

## E2E Tests (requires seeded DB + running dev server)
```bash
pnpm seed && pnpm test:e2e
```

## Remaining
- CI quality gate (deferred)
<!-- END:test-sprint-status -->
