---
story_id: 5.4
story_key: 5-4-gemini-api-integration
epic_id: 5
epic_title: Dashboard & AI Chat Interface
story_title: Gemini API Integration
status: done
created: 2026-05-13
completed: 2026-05-13
---

# Story 5-4: Gemini API Integration

## Story Foundation

**User Story:**
As a developer,
I want to integrate Gemini API with database context for natural language queries,
So that users can ask inventory-related questions with real data context.

**Acceptance Criteria:**

| Given | When | Then |
|-------|------|------|
| GEMINI_API_KEY is set in environment | POST /api/ai/chat is called with user question | API fetches relevant inventory data from PostgreSQL (via Prisma) |
| | | API constructs prompt with user question + data context |
| | | API proxies request to Gemini with full context |
| | | Response returns within 5 seconds (NFR2) |
| | | API key is hidden from client (server-side only) |

---

## Developer Context

### Current State

- Story 5-3 complete (AI Chat UI)
- No API endpoint exists at `/api/ai/chat`
- No Gemini API integration yet
- Dashboard can send requests but receives errors

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `/app/api/ai/chat/route.ts` | NEW | POST endpoint for AI chat |
| `/lib/ai/gemini.ts` | NEW | Gemini API client wrapper |
| `.env.local` (if needed) | UPDATE | Add GEMINI_API_KEY placeholder |

### Dependencies Needed

- `@google/generative-ai` — Official Google Gemini SDK

### Code Patterns to Follow

- **API Routes** — Use Next.js App Router route handlers
- **Server-side only** — API key never exposed to client
- **Error handling** — Return user-friendly error messages
- **Timeout** — 5 second max response time (NFR2)
- **Prisma** — Use existing Prisma client for DB queries

---

## Technical Requirements

### API Endpoint Structure

```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getInventoryContext } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    // Fetch relevant data from database
    const context = await getInventoryContext(message);
    
    // Call Gemini API with context
    const response = await callGemini(message, context);
    
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

### Gemini Client

- Use `@google/generative-ai` SDK
- Construct prompts with:
  - User question
  - Current inventory data (items, quantities, reorder points)
  - Recent purchase orders
  - Vendor information
- Set `maxOutputTokens` and temperature for consistent responses

### Environment Variables

```env
GEMINI_API_KEY=your-api-key-here
```

---

## Notes

- API key must remain server-side only (never expose to client)
- Implement timeout handling for 5-second NFR
- Graceful fallback if API key is missing
- Store API key in `.env.local` (already in .gitignore)
- Prisma queries should be optimized (select only needed fields)

---

## Tasks / Subtasks

- [ ] Install @google/generative-ai dependency
- [ ] Create /lib/ai/gemini.ts client module
- [ ] Create /app/api/ai/chat/route.ts POST endpoint
- [ ] Implement inventory context fetching (items, quantities, POs)
- [ ] Implement prompt construction with context
- [ ] Add timeout handling (5 second limit)
- [ ] Add error handling for missing API key
- [ ] Test API endpoint manually
- [ ] Verify from AI Chat UI component

---

## File List

**New Files:**
- `lib/ai/gemini.ts` - Gemini API client wrapper
- `app/api/ai/chat/route.ts` - POST endpoint for chat

**Modified Files:**
- `package.json` - Add @google/generative-ai dependency
- `sprint-status.yaml` - Update story status