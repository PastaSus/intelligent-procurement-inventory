---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
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
| **Project Type**      | Web Application (PERN Stack)                                    |
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
| **Growth** | Reports & analytics, CSV import/export, Multi-location support, Advanced filtering/sorting, Role-based permissions  |
| **Vision** | Barcode scanning, Auto-reorder rules, Multi-warehouse, Full e-commerce integrations, Subscription billing (SaaS)    |

---

## User Journeys

### User Types (Based on Industry Standards)

| Role                | Description                      | Permissions                           |
| ------------------- | -------------------------------- | ------------------------------------- |
| **Admin/Owner**     | Full access - manages everything | All CRUD, AI features, can create POs |
| **Staff/Member**    | Day-to-day operations            | CRUD on inventory, vendors, view AI   |
| **Viewer** (future) | Read-only access                 | View only - no edits                  |

For MVP: 2 roles (Admin + Staff) with basic auth.

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

- **Low stock alerts:** Query `WHERE quantity < reorder_point`
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
- Basic role-based access (Admin vs Staff)
