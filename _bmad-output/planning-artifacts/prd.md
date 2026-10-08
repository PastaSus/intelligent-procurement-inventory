---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - _bmad-output/brainstorming/session-2026-05-04.md
workflowType: "prd"
classification:
  projectType: Web Application
  domain: E-commerce / Supply Chain / Inventory Management
  complexity: Medium
  projectContext: greenfield
---

# Product Requirements Document - intelligent-procurement-inventory

**Author:** Administrator
**Date:** 2026-05-05

## Executive Summary

### What This Product Does

A procurement and inventory management system with a conversational AI interface. Users can ask questions in natural language ("What should I reorder?"), get AI-powered demand predictions, and manage all inventory data — without navigating complex dashboards or learning complicated software.

### Target Users

Small business owners and staff (1-5 person teams) who currently use spreadsheets or basic tools for inventory management, want smarter insights but can't afford enterprise systems ($200+/month), and need something easy enough that anyone on the team can use.

### The Problem Being Solved

- SMBs lose money through over-ordering or stockouts
- 54% of businesses still use spreadsheets because existing tools are too complex
- Enterprise software costs $200-500/month with per-user fees
- 89% of companies use outdated forecasting methods
- Only 23% have any AI-powered inventory optimization

### What Makes This Special

**Differentiators:**

1. **Natural Language Interface** — Instead of building filters, reports, and dashboards, users just ask. "What's my lowest stock?" "Summarize this month's orders" "Predict next month's needs"
2. **Human-in-the-Loop Trust** — AI suggests, human approves. No black-box decisions. Critical for when AI gets things wrong.
3. **SMB-Fit** — Built for small teams, not enterprise. Simple pricing, no per-user fees.
4. **Affordable to Build** — Using free tiers (Gemini API, Vercel, Supabase/Neon) so no budget required.

### Core Insight

Postgres stores the data, the AI layer makes it accessible. The value isn't proactive alerts (that's just IF-ELSE) — it's natural language queries + intelligent predictions that would otherwise require building separate dashboards, reports, and forecasting features.

---

## Project Classification

| Attribute             | Value                                                           |
| --------------------- | --------------------------------------------------------------- |
| **Project Type**      | Web Application (Next.js + Prisma + PostgreSQL stack)           |
| **Domain**            | E-commerce / Supply Chain / Inventory Management                |
| **Complexity**        | Medium (AI integration, database relationships, real-time data) |
| **Project Context**   | Greenfield (new build)                                          |
| **Budget Constraint** | $0 — using free tiers for all services                          |

---

## Success Criteria

### User Success

| Metric                   | Target                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Time to first action** | New user can add/view inventory within 5-10 minutes                                                                    |
| **Key actions**          | 1) Modify inventory (CRUD), 2) Check stock levels, 3) Get AI predictions, 4) Create purchase orders, 5) Manage vendors |
| **Aha moment**           | "damn, this makes things much more easier and faster"                                                                  |
| **Ease of use**          | Any team member (admin/staff) can use without training                                                                 |
| **Mobile experience**     | Bottom navigation (5 items), responsive design                                                                          |
| **Visual feedback**       | Color-coded stock indicators, progress bars, toast notifications                                                           |

### Business Success

| Goal                 | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| **Working MVP**      | Demonstrates core concept — CRUD + AI chat works           |
| **Portfolio-ready**  | Professional quality code to show employers                |
| **Real-use capable** | Could actually use if you had a small business             |
| **SaaS potential**   | Built professionally enough to pivot to paid product later |

### Technical Success

| Must Work             | Description                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| **CRUD operations**   | Inventory, Vendors, Purchase Orders (core CRUD app)                           |
| **AI integration**    | Chat interface with Gemini API (MVP requirement since "intelligent" in title) |
| **Human-in-the-loop** | AI suggests, human approves — no auto-actions                                 |
| **Low stock alerts**  | Dashboard shows items below reorder point                                     |

---

## Product Scope

| Level      | Features                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| **MVP**    | Inventory CRUD, Vendor CRUD, PO creation, AI chat (ask questions, get predictions), Low stock dashboard, Basic auth |
| **Growth** | Reports & analytics, CSV import/export, Multi-location support, Advanced filtering/sorting |
| **Vision** | Barcode scanning, Auto-reorder rules, Multi-warehouse, Full e-commerce integrations, Subscription billing (SaaS)    |

---

## User Journeys

### User Types (Based on Industry Standards)

| Role                  | Description                                       | Permissions                                                                              |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Admin/Lab Manager** | Full access - manages everything incl. inventory | All CRUD, approve/reject/fulfill PRs, AI features                                        |
| **Technician**        | Lab tech work - components, repairs, reports      | Rooms/units/components/software CRUD, inventory view-only, PR view-only, reports view   |

For MVP: 2 roles (Admin + Technician) with role-based access enforced by server actions (authentication in middleware).

---

### Journey 1: Small Business Owner (Admin)

**Opening Scene:** Losing money — overstock on some items, out of stock on others.

**Rising Action:**

1. Log in → see dashboard with low stock alerts
2. Ask AI: "What should I reorder this month?"
3. AI suggests: "Product X is low, you sold 50 last month, reorder 60 units"
4. Review AI suggestion → click "Create PO"
5. Fill in vendor details → submit as draft

**Climax:** Approves the PO draft, exports as email-ready message.

**Resolution:** "This makes things much easier and faster."

---

### Journey 2: Staff/Employee (Member)

**Opening Scene:** New stock arrived. Need to update the system.

**Rising Action:**

1. Log in → go to Inventory page
2. Click "Add Product" or find existing item → click "Edit"
3. Update quantity (Stock In)
4. Check Vendor list for supplier details
5. Save → see inventory updated immediately

**Climax:** Successfully records stock. Can answer "What's in stock?" for customers.

**Resolution:** Feels comfortable using the system without training.

---

### Journey 3: AI Gives Wrong Advice (Edge Case)

**Problem:** AI suggests ordering 100 units when 10 is enough.

**What Happens:**

1. User sees AI suggestion on dashboard
2. User knows it's wrong (has domain knowledge)
3. User modifies quantities in PO or ignores suggestion
4. Human always approves — no auto-actions

**How We Handle It:**

- AI suggests, human **approves** — always
- For MVP: Simple — AI suggests, user decides
- Future: Show confidence level, feedback button, log overrides

---

### Journey 4: Forgot Password (Edge Case)

1. Click "Forgot Password" on login
2. Enter email address
3. System sends reset link
4. User clicks link → creates new password
5. Log in with new password

---

### Journey Requirements Summary

| Capability                                         | From Journey      |
| -------------------------------------------------- | ----------------- |
| Dashboard with low stock alerts                    | Owner journey     |
| AI chat interface (ask questions, get predictions) | Owner journey     |
| PO creation workflow (draft → approve → export)    | Owner journey     |
| Inventory CRUD (add, edit, delete, view)           | Staff journey     |
| Vendor CRUD                                        | Staff journey     |
| Basic auth (login, logout)                         | All journeys      |
| Password reset flow                                | Edge case journey |
| Human-in-the-loop for all AI suggestions           | AI error journey  |

---

## Domain-Specific Requirements

### Data Integrity & Validation

| Rule                           | Implementation                                           |
| ------------------------------ | -------------------------------------------------------- |
| **Prevent negative inventory** | Database constraint: `quantity >= 0`                     |
| **Soft delete**                | Records marked as `deleted = true`, not actually deleted |
| **Foreign keys**               | All relationships enforced at database level             |
| **NOT NULL**                   | Required fields enforced in schema                       |

### Audit Trail (MVP)

| Field        | Purpose                              |
| ------------ | ------------------------------------ |
| `created_at` | When record was created              |
| `updated_at` | When record was last modified        |
| `created_by` | User ID who created the record       |
| `updated_by` | User ID who last modified the record |

Simple audit trail: timestamps + user ID on every record.

### Business Logic

- **Low stock alerts:** Query `WHERE quantity <= reorder_point`
- **PO workflow:** Draft → Approved → Sent (status enum)
- **Single location:** MVP only, no multi-warehouse support

### Data Management

| Feature     | Priority                                    |
| ----------- | ------------------------------------------- |
| CSV Export  | Important — backup/restore                  |
| CSV Import  | Important — migrate data                    |
| Data backup | Cloud database handles this (Supabase/Neon) |

### Security (MVP)

- Password hashing (bcrypt)
- Session management
- Role-based access (Admin vs Technician), enforced by server actions

---

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **AI-Powered Speed** — Predictions based on data, but faster than manual computation. The "AI touch" makes it smarter without user needing to be a data analyst.

2. **Simplicity as Innovation** — Challenging the assumption that inventory software must be complex. "Only complex if it needs to be" — this is a genuine differentiator from enterprise tools.

3. **Natural Language Interface (NLP)** — No more learning complex dashboards. Just ask questions in plain English. Still includes traditional dashboard for users who prefer that.

4. **Human-in-the-Loop Trust** — AI assists, human decides. Not a black box — critical for SMBs who need control.

### Validation Approach

- Compare time-to-insight vs traditional spreadsheets
- Track prediction accuracy vs manual forecasting
- Measure user task completion (can new staff use it without training?)

### Risk Mitigation

- If AI predictions fail, fallback to basic inventory metrics
- Human always approves — no auto-actions
- Traditional dashboard available as fallback for non-NL users

---

## Web Application Specific Requirements

### Project-Type Overview

- **Architecture:** Single Page Application (SPA) using Next.js App Router
- **Target Browsers:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Rendering:** Server Components with client-side interactivity

### Technical Considerations

| Feature | Decision | Priority |
|---------|----------|----------|
| **Rendering** | Next.js App Router with Server Actions | Required |
| **Real-time** | Polling/manual refresh for MVP, WebSockets future consideration | Future |
| **SEO** | Not required for MVP | Skip |
| **Accessibility** | WCAG compliance required | Required |
| **Performance** | Lighthouse: target 100 on all except performance | Target |

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratios met
- Focus indicators visible

### Lighthouse Targets

| Metric | Target |
|--------|--------|
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 (skip for MVP) |
| Performance | Target based on content |

### Implementation Considerations

- Server Actions for all mutations with revalidation
- Optimistic UI updates for instant feedback
- Responsive design for mobile/tablet
- Toast notifications for user feedback

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — core inventory management + AI insights
**Resource Requirements:** Solo developer using BMad method
**Timeline:** 2 months for MVP

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Small Business Owner: Dashboard → AI chat → PO creation
- Staff: Inventory CRUD operations
- Human-in-the-loop for all AI suggestions

**Must-Have Capabilities:**
- Inventory CRUD (add, edit, delete, view)
- Vendor CRUD
- Purchase Order creation (draft → approve → export)
- AI chat interface (Gemini API integration)
- Low stock dashboard alerts
- Basic auth (login/logout, password reset)

### Post-MVP Features

**Growth (Phase 2):**
- Reports & analytics
- CSV import/export
- Multi-location support
- Advanced filtering/sorting
- Role-based permissions (Admin vs Staff)

**Vision (Phase 3):**
- Barcode scanning
- Auto-reorder rules
- Multi-warehouse
- Full e-commerce integrations
- Subscription billing (SaaS)

### Risk Mitigation

**Technical Risks:** AI integration (Gemini API) — mitigate by starting with simple prompts, test extensively with sample data. Fallback: If Gemini unavailable, show "AI is unavailable right now" with basic inventory metrics.

**Market Risks:** SMB adoption — validate early with real users, focus on "easy to use" differentiator

**Resource Risks:** Solo developer — scope tightly to MVP, use BMad method for efficiency, avoid feature creep

### Testing Requirements

- Seed data needed for testing (use faker.js or manual input)
- Validate with sample inventory, vendors, and POs
- Problem validation needed: survey real SMB owners to confirm this solves their problem

---

## Functional Requirements

### Inventory Management

- FR1: Users can create new inventory items
- FR2: Users can view inventory items with current stock levels
- FR3: Users can edit inventory item details
- FR4: Users can delete inventory items
- FR5: System prevents negative inventory quantities
- FR6: System alerts users when inventory falls below reorder point

### Vendor Management

- FR7: Users can create new vendor records
- FR8: Users can view vendor information
- FR9: Users can edit vendor details
- FR10: Users can delete vendor records

### Purchase Order Management

- FR11: Users can create purchase orders
- FR12: Users can view existing purchase orders
- FR13: Users can edit draft purchase orders
- FR14: Users can approve purchase orders
- FR15: Users can export purchase orders
- FR16: System tracks purchase order status (Draft → Approved → Sent)

### AI Chat Interface

- FR17: Users can ask questions in natural language about inventory via floating bubble (bottom-right) + full-screen route
- FR18: System provides AI-powered demand predictions with rich suggestion cards (item, qty, reasoning, confidence bar, urgency styling)
- FR19: Users can request reorder suggestions from AI; "Create PO" button pre-fills vendor + line items for human review
- FR20: System requires human approval for all AI suggestions; human edits quantities before save (not just approve)
- FR17b: Chat interface shows streaming indicator when AI is thinking, suggested prompts below input, markdown rendering, copy button, thumbs up/down feedback
- FR17c: Notification badge on bubble when AI detects low stock or reorder suggestion (proactive alert)
- FR17d: Full-screen chat route includes conversation history, search past chats, command palette (Ctrl+K)
- FR19b: AI suggests reorder quantities with reasoning ("Sold 30 last month") and confidence level (low/medium/high)
- FR19c: "Edit" option on suggestion cards allows human to modify qty/items before creating PO
- FR19d: Dismiss option on suggestion cards with feedback logging for AI improvement

### Dashboard

- FR21: Users can view dashboard with low stock alerts
- FR22: Users can see inventory metrics
- FR23: System displays color-coded stock indicators (red/yellow/green)
- FR24: System shows progress bars for stock vs reorder point

### Authentication & Authorization

- FR25: Users can log in
- FR26: Users can log out
- FR27: Users can reset forgotten passwords
- FR28: System enforces role-based access (Admin vs Technician)
- FR42: Technician role replaces Staff across database, seed data, sessions, and UI
- FR43: Technicians have full CRUD on rooms, units, components, and software, including NEEDS_REPAIR / NEEDS_REPLACEMENT status flags
- FR44: Spare-parts inventory mutations are restricted to Admin; Technicians have read-only access
- FR45: Purchase request creation, submission, approval, rejection, and fulfillment are restricted to Admin; Technicians have read-only access

### Navigation & Layout

- FR29: System provides mobile-first bottom navigation (5 items max)
- FR30: System provides desktop left sidebar navigation at md breakpoint
- FR31: Toast notifications auto-dismiss after 3-5 seconds

### Data Management

- FR27: Users can export inventory data (CSV)
- FR28: Users can import inventory data (CSV)

### Reporting & Analytics

- FR29: Users can view reports and analytics
- FR30: Users can filter and sort inventory data

### Audit Trail

- FR31: System tracks creation and modification timestamps
- FR32: System tracks who created and modified records

---

## Non-Functional Requirements

### Performance

- NFR1: Dashboard loads within 2 seconds for 95th percentile under normal load
- NFR2: AI chat responses return within 5 seconds for typical queries
- NFR3: Inventory search returns results within 1 second for datasets up to 10,000 items

### Security

- NFR4: All passwords hashed using bcrypt with salt rounds ≥ 10
- NFR5: User sessions managed securely with HTTP-only cookies
- NFR6: Inventory and PO data accessible only to authenticated users with proper role (Technician: read-only; Admin: full access)
- NFR7: All data encrypted in transit (TLS 1.2+)

### Accessibility

- NFR8: UI meets WCAG 2.1 AA compliance standards
- NFR9: All interactive elements keyboard navigable
- NFR10: Color contrast ratios meet 4.5:1 minimum for normal text

### Reliability

- NFR11: System maintains 99.9% uptime during business hours (measured by cloud provider)
- NFR12: AI service failures gracefully fall back to dashboard stats with friendly message ("AI is currently not available, here's your current status instead"); retry button with countdown timer; subtle "AI degraded" indicator on bubble when service is degraded

### Scalability (Growth)

- NFR13: System supports up to 100 concurrent users with <10% performance degradation
- NFR14: Database handles up to 100,000 inventory items without performance impact
