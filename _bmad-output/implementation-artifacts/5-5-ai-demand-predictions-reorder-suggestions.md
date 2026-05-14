---
story_id: 5.5
story_key: 5-5-ai-demand-predictions-reorder-suggestions
epic_id: 5
epic_title: Dashboard & AI Chat Interface
story_title: AI Demand Predictions & Reorder Suggestions
status: done
created: 2026-05-14
completed: 2026-05-14
---

# Story 5-5: AI Demand Predictions & Reorder Suggestions

## Story Foundation

**User Story:**
As a user,
I want AI to provide demand predictions and reorder suggestions,
So that I know what to order and in what quantities.

**Acceptance Criteria:**

| Given | When | Then |
|-------|------|------|
| User asks "What should I reorder?" or similar | AI processes the question | AI returns suggestions with item names and suggested quantities |
| | | Suggestions include reasoning (e.g., "Sold 50 last month") |
| | | "Create PO" button appears next to suggestions |

**FRs covered:** FR19, FR19b

---

## Developer Context

### Current State

- Story 5-4 complete (Gemini API Integration)
- AI chat works but returns raw text without structured suggestions
- No mechanism to extract reorder suggestions from AI responses
- No UI to display suggestions with action buttons

### Files Created

| File | Description |
|------|-------------|
| `/components/SuggestionCards.tsx` | Component displaying reorder suggestions with confidence levels and action buttons |
| `/lib/ai/suggestion-parser.ts` | Utility to parse structured reorder suggestions from AI responses |
| `/app/dashboard/chat/FullScreenChat.tsx` | Enhanced to parse and display suggestion cards after AI responses |

### Dependencies Needed

- `lucide-react` (already installed) — Icons for suggestion cards

### Code Patterns to Follow

- Client components with 'use client' directive
- ReorderSuggestion interface with confidence levels
- Suggestion cards rendered below AI response in chat

---

## Implementation Notes

### Key Decisions

- **Confidence level detection**: Based on reasoning keywords (e.g., "sold" = high, "trend" = medium, "might" = low) rather than requiring the AI model to provide structured confidence scores
- **Multiple parsing patterns**: Supports numbered lists, structured format (Item: X, Quantity: Y, Reason: Z), and simple format to handle varied AI response styles
- **Suggestion ID**: Generated with `Date.now()` + counter since suggestions are ephemeral (not persisted to DB)

### Suggestion Cards Component

- Displays confidence level with color-coded badges (yellow=low, blue=medium, green=high)
- Shows item name, suggested quantity, reasoning, and estimated daily usage if available
- "Create PO" button and dismiss (X) button per suggestion
- Handles empty state (returns null when no suggestions)

### Suggestion Parser

- Pattern 1: `Item: X, Quantity: Y, Reason: Z` format
- Pattern 2: Numbered list format
- Pattern 3: Simple "Suggest ordering X units of [Product]" format
- Confidence determined by keyword analysis of reasoning text

### Integration in FullScreenChat

- After AI response received, `hasReorderSuggestions()` checks for suggestion markers
- If found, `parseReorderSuggestions()` extracts structured suggestions
- Suggestions rendered via `<SuggestionCards>` below the AI message
- "Create PO" handler sets `selectedSuggestion` to open dialog (wired in Story 5-6)

---

## Tasks / Subtasks

- [x] Create `lib/ai/suggestion-parser.ts` with regex patterns
- [x] Create `components/SuggestionCards.tsx` with confidence badges and action buttons
- [x] Integrate suggestion parsing and display into FullScreenChat
- [x] Wire "Create PO" button to open dialog handler
- [x] Add dismiss functionality per suggestion
- [x] TypeScript check passes (0 errors)
- [x] Build passes

### Review Findings (patches applied)

- [x] [Review][Patch] `handlePOSuccess` cleared ALL suggestions — now filters only the approved one (FullScreenChat.tsx)
- [x] [Review][Patch] Suggestions persisted on conversation switch — now cleared on switch (FullScreenChat.tsx)
- [x] [Review][Patch] No AbortController on vendor fetch — added cleanup (AISuggestionPODialog.tsx)
- [x] [Review][Patch] 401 produced misleading retry loop — added explicit 401 message (AISuggestionPODialog.tsx)
- [x] [Review][Patch] Missing vendor on re-fetch silently vanished — shows error UI (AISuggestionPODialog.tsx)
- [x] [Review][Patch] `canEdit` redundant expression — simplified (CreatePOForm.tsx)
- [x] [Review][Patch] `unitPrice: 0` guaranteed server rejection — added inline validation (CreatePOForm.tsx)
- [x] [Review][Patch] Fields editable during submission — disabled with isSubmitting (CreatePOForm.tsx)

---

## File List

**New Files:**
- `components/SuggestionCards.tsx` - Reorder suggestion display component
- `lib/ai/suggestion-parser.ts` - Suggestion extraction utility

**Modified Files:**
- `app/dashboard/chat/FullScreenChat.tsx` - Suggestion integration
- `app/dashboard/purchase-orders/components/CreatePOForm.tsx` - AI flow edits support
- `app/dashboard/chat/AISuggestionPODialog.tsx` - Vendor/Po dialog
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status update
