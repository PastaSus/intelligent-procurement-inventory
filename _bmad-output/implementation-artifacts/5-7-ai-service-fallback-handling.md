---
story_id: 5.7
story_key: 5-7-ai-service-fallback-handling
epic_id: 5
epic_title: Dashboard & AI Chat Interface
story_title: AI Service Fallback Handling
status: done
created: 2026-05-14
completed: 2026-05-14
---

# Story 5-7: AI Service Fallback Handling

## Story Foundation

**User Story:**
As a user,
I want the system to gracefully handle AI service failures,
So that I can still use basic inventory metrics when AI is unavailable.

**Acceptance Criteria:**

| Given | When | Then |
|-------|------|------|
| Gemini API is unavailable or returns error | User attempts to use AI chat | System displays "AI is unavailable right now" |
| | | Basic inventory metrics are shown as fallback (NFR12) |
| | | User can still access dashboard and inventory normally |

**FRs covered:** NFR12

---

## Developer Context

### Current State

- Story 5-6 complete (Human-in-the-Loop Approval)
- API route returns structured errors (503 no API key, 504 timeout, 500 generic)
- Client shows generic "Sorry, something went wrong" on all errors
- No fallback metrics shown when AI is unavailable

### Files Modified

| File | Description |
|------|-------------|
| `/app/dashboard/chat/FullScreenChat.tsx` | AI unavailable detection + fallback metrics display |

### Dependencies Needed

- None (uses existing `/api/dashboard` endpoint)

---

## Implementation Notes

### Key Decisions

- **Status code detection**: 503 (not configured) and 504 (timeout) trigger the "AI unavailable" message; network errors (fetch failures) also trigger it
- **Fallback data source**: Reuses existing `/api/dashboard` endpoint which returns `totalInventory`, `lowStockCount`, and `pendingPOs`
- **Error message parsing**: Reads the JSON error body from the API to show the specific reason alongside the "unavailable" message
- **Graceful degradation**: Fallback stats fetch is wrapped in try/catch — if stats fail, user still gets the "AI unavailable" message

### Error Scenarios Handled

| Scenario | Response |
|----------|----------|
| 503 (API key not configured) | "AI is unavailable right now. AI service is not configured." + fallback stats |
| 504 (Timeout) | "AI is unavailable right now. AI service took too long to respond." + fallback stats |
| Network error | "AI is unavailable right now. Network error — could not reach the AI service." + fallback stats |
| Other HTTP errors | "Sorry, something went wrong: [error detail]" + fallback stats |
| Fallback stats unavailable | AI unavailable message shown without stats |

---

## Tasks / Subtasks

- [x] Read error JSON body from API on non-ok responses
- [x] Detect 503/504 status codes for "AI unavailable" message
- [x] Detect network errors for "AI unavailable" message
- [x] Fetch `/api/dashboard` for fallback metrics
- [x] Display fallback metrics alongside unavailable message
- [x] Handle case where fallback stats fetch also fails
- [x] Update conversation state on error (was missing setConversations call)
- [x] Build passes

---

## File List

**Modified Files:**
- `app/dashboard/chat/FullScreenChat.tsx` - Error handling with fallback metrics
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status update
