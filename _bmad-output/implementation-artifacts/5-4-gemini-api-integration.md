---
story_id: 5.4
story_key: 5-4-groq-api-integration
epic_id: 5
epic_title: Dashboard & AI Chat Interface
story_title: Groq API Integration (formerly Gemini)
status: done
created: 2026-05-13
completed: 2026-05-15
---

# Story 5-4: Groq API Integration

## Story Foundation

**User Story:**
As a developer,
I want to integrate Groq API with database context for natural language queries,
So that users can ask inventory-related questions with real data context.

**Acceptance Criteria:**

| Given | When | Then |
|-------|------|------|
| GROQ_API_KEY is set in environment | POST /api/ai/chat is called with user question | API fetches relevant inventory data from PostgreSQL (via Prisma) |
| | | API constructs prompt with user question + data context |
| | | API proxies request to Groq with full context |
| | | Response returns within 5 seconds (NFR2) |
| | | API key is hidden from client (server-side only) |

---

## Developer Context

### Current State

- Story 5-3 complete (AI Chat UI)
- API endpoint exists at `/api/ai/chat`
- Groq API integration complete
- Model: llama-3.1-8b-instant (free tier, ~750 tok/s)

### Files

| File | Action | Description |
|------|--------|-------------|
| `/app/api/ai/chat/route.ts` | COMPLETE | POST endpoint for AI chat |
| `/lib/ai/groq.ts` | COMPLETE | Groq API client wrapper (renamed from gemini.ts) |
| `.env.local` | UPDATE | Added GROQ_API_KEY |

### Dependencies

- `openai` — OpenAI-compatible client for Groq (works with Groq's API)

### Code Patterns

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
import { getInventoryContext, callGroq, validateApiKey } from '@/lib/ai/groq';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set GROQ_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    const { message } = await request.json();
    const context = await getInventoryContext();
    const response = await callGroq(message, context, apiKey);

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

### Groq Client

- Use OpenAI SDK with Groq base URL (`https://api.groq.com/openai/v1`)
- Model: `llama-3.1-8b-instant` (fast, free tier)
- Construct prompts with:
  - User question
  - Current inventory data (items, quantities, reorder points)
  - Recent purchase orders
  - Vendor information

### Environment Variables

```env
GROQ_API_KEY=your-groq-api-key-here
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

- [x] Install openai dependency
- [x] Create /lib/ai/groq.ts client module
- [x] Create /app/api/ai/chat/route.ts POST endpoint
- [x] Implement inventory context fetching (items, quantities, POs)
- [x] Implement prompt construction with context
- [x] Add timeout handling (5 second limit)
- [x] Add error handling for missing API key
- [x] Test API endpoint manually
- [x] Verify from AI Chat UI component

---

## File List

**Files:**
- `lib/ai/groq.ts` - Groq API client wrapper
- `app/api/ai/chat/route.ts` - POST endpoint for chat

**Modified Files:**
- `package.json` - Added openai dependency
- `sprint-status.yaml` - Story status

---

## Migration Note

Switched from Gemini to Groq on 2026-05-15 due to API quota issues. Groq offers:
- Faster inference (~750 tok/s vs Gemini's ~50 tok/s)
- Generous free tier (30 RPM, 14,400 requests/day)
- OpenAI-compatible API (easy to switch)
- No credit card required