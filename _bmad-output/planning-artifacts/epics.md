---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# intelligent-procurement-inventory - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for intelligent-procurement-inventory, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create new inventory items
FR2: Users can view inventory items with current stock levels
FR3: Users can edit inventory item details
FR4: Users can delete inventory items
FR5: System prevents negative inventory quantities
FR6: System alerts users when inventory falls below reorder point
FR7: Users can create new vendor records
FR8: Users can view vendor information
FR9: Users can edit vendor details
FR10: Users can delete vendor records
FR11: Users can create purchase orders
FR12: Users can view existing purchase orders
FR13: Users can edit draft purchase orders
FR14: Users can approve purchase orders
FR15: Users can export purchase orders
FR16: System tracks purchase order status (Draft → Approved → Sent)
FR17: Users can ask questions in natural language about inventory
FR18: System provides AI-powered demand predictions
FR19: Users can request reorder suggestions from AI
FR20: System requires human approval for all AI suggestions
FR21: Users can view dashboard with low stock alerts
FR22: Users can see inventory metrics
FR23: System displays color-coded stock indicators (red/yellow/green)
FR24: System shows progress bars for stock vs reorder point
FR25: Users can log in
FR26: Users can log out
FR27: Users can reset forgotten passwords
FR28: System enforces role-based access (Admin vs Staff)
FR29: System provides mobile-first bottom navigation (5 items max)
FR30: System provides desktop left sidebar navigation at md breakpoint
FR31: Toast notifications auto-dismiss after 3-5 seconds
FR32: Users can export inventory data (CSV)
FR33: Users can import inventory data (CSV)
FR34: Users can view reports and analytics
FR35: Users can filter and sort inventory data
FR36: System tracks creation and modification timestamps
FR37: System tracks who created and modified records

### NonFunctional Requirements

NFR1: Dashboard loads within 2 seconds for 95th percentile under normal load
NFR2: AI chat responses return within 5 seconds for typical queries
NFR3: Inventory search returns results within 1 second for datasets up to 10,000 items
NFR4: All passwords hashed using bcrypt with salt rounds ≥ 10
NFR5: User sessions managed securely with HTTP-only cookies
NFR6: Inventory and PO data accessible only to authenticated users with proper role
NFR7: All data encrypted in transit (TLS 1.2+)
NFR8: UI meets WCAG 2.1 AA compliance standards
NFR9: All interactive elements keyboard navigable
NFR10: Color contrast ratios meet 4.5:1 minimum for normal text
NFR11: System maintains 99.9% uptime during business hours (measured by cloud provider)
NFR12: AI service failures gracefully fall back to basic inventory metrics
NFR13: System supports up to 100 concurrent users with <10% performance degradation
NFR14: Database handles up to 100,000 inventory items without performance impact

### Additional Requirements

- Starter template: Extend existing Next.js 16.2.4 scaffold (keep current setup, add dependencies)
- Dependencies to install: Prisma, @prisma/adapter-pg, pg, @prisma/client, shadcn/ui (preset b0), bcrypt, @types/bcrypt
- Database: PostgreSQL via Prisma ORM with schema in /prisma/schema.prisma
- UI Framework: Tailwind CSS v4 + shadcn/ui components
- Authentication: Session-based with bcrypt (HTTP-only cookies)
- API Pattern: Server Actions (mutations) + API Routes (data fetching, AI proxy)
- State Management: React state + Server Components (minimal client state)
- Deployment: Vercel (free tier) + Supabase/Neon PostgreSQL (free tier)
- Validation: Zod (server-side) + HTML5 (client-side)
- Caching: Next.js built-in fetch caching + revalidation
- Middleware: Auth check on protected routes (/dashboard/\*)
- Rate limiting: API routes (100 req/min), AI endpoint (10 req/min/user)
- Naming conventions: snake_case for DB, camelCase for TS, PascalCase for components
- Project structure: Feature-based organization with co-located components

### UX Design Requirements

No UX Design document found. Using Architecture document's UI patterns (shadcn/ui, Tailwind v4, WCAG 2.1 AA compliance).

### FR Coverage Map

FR1: Epic 2 - Create inventory items
FR2: Epic 2 - View inventory items
FR3: Epic 2 - Edit inventory items
FR4: Epic 2 - Delete inventory items
FR5: Epic 2 - Prevent negative inventory
FR6: Epic 2 - Low stock alerts
FR7: Epic 3 - Create vendor records
FR8: Epic 3 - View vendor information
FR9: Epic 3 - Edit vendor details
FR10: Epic 3 - Delete vendor records
FR11: Epic 4 - Create purchase orders
FR12: Epic 4 - View purchase orders
FR13: Epic 4 - Edit draft POs
FR14: Epic 4 - Approve POs
FR15: Epic 4 - Export POs
FR16: Epic 4 - PO status tracking
FR17: Epic 5 - Ask AI questions
FR18: Epic 5 - AI demand predictions
FR19: Epic 5 - AI reorder suggestions
FR20: Epic 5 - Human approval for AI
FR21: Epic 5 - Dashboard low stock alerts
FR22: Epic 5 - Inventory metrics
FR23: Epic 5 - Color-coded indicators
FR24: Epic 5 - Stock progress bars
FR25: Epic 1 - User login
FR26: Epic 1 - User logout
FR27: Epic 1 - Password reset
FR28: Epic 1 - Role-based access
FR29: Epic 1 - Mobile bottom navigation
FR30: Epic 1 - Desktop sidebar navigation
FR31: Epic 1 - Toast notifications
FR32: Epic 6 - Export CSV data
FR33: Epic 6 - Import CSV data
FR34: Epic 6 - View reports & analytics
FR35: Epic 6 - Filter/sort data
FR36: Epic 2 - Creation/modification timestamps
FR37: Epic 2 - Track who created/modified

## Epic List

### Epic 1: User Authentication & Navigation

Enable secure access and intuitive navigation for all user types.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31
**User value:** Users can log in securely, reset passwords, and navigate via mobile bottom nav or desktop sidebar with role-based access.

#### Story 1.1: User Login

As a user,
I want to log in with my email and password,
So that I can access the system securely.

**Acceptance Criteria:**

**Given** user is on login page
**When** user enters valid email and password
**Then** system validates credentials using bcrypt comparison
**And** system creates session with HTTP-only cookie
**And** system redirects to dashboard

#### Story 1.2: User Logout

As a user,
I want to log out of the system,
So that my session is securely terminated.

**Acceptance Criteria:**

**Given** user is logged in
**When** user clicks logout button
**Then** system destroys session
**And** system clears HTTP-only cookie
**And** system redirects to login page

#### Story 1.3: Password Reset

As a user,
I want to reset my forgotten password,
So that I can regain access to my account.

**Acceptance Criteria:**

**Given** user is on login page
**When** user clicks "Forgot Password" and enters email
**Then** system validates email exists
**And** system generates reset token (expires in 1 hour)
**And** system displays "Reset link sent" message

#### Story 1.4: Role-Based Access Control

As an admin or staff user,
I want the system to enforce my role permissions,
So that I only access features appropriate to my role.

**Acceptance Criteria:**

**Given** user is logged in as Staff
**When** user attempts to access admin-only features
**Then** system denies access and shows unauthorized message
**And** middleware validates role on all protected routes

#### Story 1.5: Mobile Bottom Navigation

As a mobile user,
I want bottom navigation with 5 key items,
So that I can easily navigate the app on mobile devices.

**Acceptance Criteria:**

**Given** user is on mobile device (md breakpoint)
**When** user views any dashboard page
**Then** bottom navigation shows 5 items: Dashboard, Inventory, Vendors, Purchase Orders, More
**And** active item is highlighted
**And** navigation meets WCAG 2.1 AA accessibility

#### Story 1.6: Desktop Sidebar Navigation

As a desktop user,
I want a left sidebar navigation,
So that I can easily navigate the app on larger screens.

**Acceptance Criteria:**

**Given** user is on desktop (md breakpoint and above)
**When** user views any dashboard page
**Then** left sidebar shows all navigation items
**And** active item is highlighted
**And** sidebar can be collapsed/expanded

#### Story 1.7: Toast Notifications

As a user,
I want to see auto-dismissing toast notifications,
So that I receive feedback on my actions.

**Acceptance Criteria:**

**Given** user performs an action (save, delete, error)
**When** action completes
**Then** toast notification appears with appropriate message
**And** toast auto-dismisses after 3-5 seconds
**And** toast shows correct variant (success/error/warning)

### Epic 2: Inventory Management

Complete inventory tracking with audit trail and low stock alerts.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR36, FR37
**User value:** Users can create, view, edit, delete inventory items with audit trail (timestamps, created/modified by) and automatic low stock alerts.

#### Story 2.1: Inventory Database Schema & Setup

As a developer,
I want to set up the Prisma schema for inventory items,
So that the system can store and retrieve inventory data with audit fields.

**Acceptance Criteria:**

**Given** Prisma is installed and configured
**When** schema.prisma is updated with InventoryItem model
**Then** model includes: id, sku, name, description, quantity, reorderPoint, category, created_at, updated_at, created_by, updated_by, deleted
**And** quantity has constraint >=0
**And** migration runs successfully
**And** audit fields are automatically populated on create/update

#### Story 2.2: Create Inventory Item

As a user,
I want to create new inventory items with details,
So that I can track products in the system.

**Acceptance Criteria:**

**Given** user is on Inventory page
**When** user clicks "Add Product" and fills in details (name, sku, quantity, reorder point, category)
**Then** system validates input with Zod schema
**And** inventory item is saved to database with audit fields
**And** user sees success toast notification
**And** page revalidates to show new item

#### Story 2.3: View Inventory List with Stock Levels

As a user,
I want to view all inventory items with current stock levels,
So that I can monitor inventory status.

**Acceptance Criteria:**

**Given** user navigates to Inventory page
**When** page loads
**Then** system displays all active inventory items (deleted=false) in a table
**And** table shows: SKU, name, quantity, reorder point, category, last updated
**And** search/filter returns results within 1 second (NFR3)
**And** table is keyboard navigable (WCAG 2.1 AA)

#### Story 2.4: Edit Inventory Item

As a user,
I want to edit existing inventory item details,
So that I can update stock levels and information.

**Acceptance Criteria:**

**Given** user is viewing inventory list
**When** user clicks "Edit" on an item
**Then** system displays pre-filled form with current values
**And** user can modify quantity, reorder point, or details
**And** updated_by and updated_at are automatically set
**And** system prevents negative quantities (FR5)

#### Story 2.5: Delete Inventory Item (Soft Delete)

As a user,
I want to delete inventory items,
So that I can remove items no longer in use.

**Acceptance Criteria:**

**Given** user is viewing inventory list
**When** user clicks "Delete" on an item
**Then** system shows confirmation dialog
**And** upon confirmation, sets deleted=true (soft delete)
**And** item no longer appears in inventory list
**And** audit trail preserves who deleted and when

#### Story 2.6: Low Stock Alerts Display

As a user,
I want to see inventory items with low stock,
So that I know what needs reordering.

**Acceptance Criteria:**

**Given** user is on Inventory page or Dashboard
**When** page loads
**Then** items where quantity < reorder_point are highlighted (red/yellow/green indicators)
**And** progress bars show stock vs reorder point (FR24)
**And** low stock alert count appears in dashboard stats (FR21)

### Epic 3: Vendor Management

Complete vendor record management.
**FRs covered:** FR7, FR8, FR9, FR10
**User value:** Users can create, view, edit, delete vendor records for PO creation.

#### Story 3.1: Vendor Database Schema & Setup

As a developer,
I want to set up the Prisma schema for vendors,
So that the system can store and retrieve vendor data.

**Acceptance Criteria:**

**Given** Prisma is installed and configured
**When** schema.prisma is updated with Vendor model
**Then** model includes: id, name, contact_name, email, phone, address, created_at, updated_at, created_by, updated_by, deleted
**And** migration runs successfully
**And** audit fields are automatically populated

#### Story 3.2: Create Vendor Record

As a user,
I want to create new vendor records,
So that I can track supplier information for purchase orders.

**Acceptance Criteria:**

**Given** user is on Vendors page
**When** user clicks "Add Vendor" and fills in details
**Then** system validates input with Zod schema
**And** vendor is saved to database with audit fields
**And** user sees success toast notification

#### Story 3.3: View Vendor List

As a user,
I want to view all vendor records,
So that I can find supplier information.

**Acceptance Criteria:**

**Given** user navigates to Vendors page
**When** page loads
**Then** system displays all active vendors (deleted=false) in a table
**And** table shows: name, contact name, email, phone
**And** table is keyboard navigable (WCAG 2.1 AA)

#### Story 3.4: Edit Vendor Details

As a user,
I want to edit existing vendor details,
So that I can update contact information.

**Acceptance Criteria:**

**Given** user is viewing vendor list
**When** user clicks "Edit" on a vendor
**Then** system displays pre-filled form with current values
**And** user can modify vendor details
**And** updated_by and updated_at are automatically set

#### Story 3.5: Delete Vendor Record

As a user,
I want to delete vendor records,
So that I can remove vendors no longer used.

**Acceptance Criteria:**

**Given** user is viewing vendor list
**When** user clicks "Delete" on a vendor
**Then** system shows confirmation dialog
**And** upon confirmation, sets deleted=true (soft delete)
**And** vendor no longer appears in vendor list

### Epic 4: Purchase Order Management

Complete inventory tracking with audit trail and low stock alerts.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR36, FR37
**User value:** Users can create, view, edit, delete inventory items with audit trail (timestamps, created/modified by) and automatic low stock alerts.

### Epic 3: Vendor Management

Complete vendor record management.
**FRs covered:** FR7, FR8, FR9, FR10
**User value:** Users can create, view, edit, delete vendor records for PO creation.

#### Story 3.1: Vendor Database Schema & Setup

As a developer,
I want to set up the Prisma schema for vendors,
So that the system can store and retrieve vendor data.

**Acceptance Criteria:**

**Given** Prisma is installed and configured
**When** schema.prisma is updated with Vendor model
**Then** model includes: id, name, contact_name, email, phone, address, created_at, updated_at, created_by, updated_by, deleted
**And** migration runs successfully
**And** audit fields are automatically populated

#### Story 3.2: Create Vendor Record

As a user,
I want to create new vendor records,
So that I can track supplier information for purchase orders.

**Acceptance Criteria:**

**Given** user is on Vendors page
**When** user clicks "Add Vendor" and fills in details
**Then** system validates input with Zod schema
**And** vendor is saved to database with audit fields
**And** user sees success toast notification

#### Story 3.3: View Vendor List

As a user,
I want to view all vendor records,
So that I can find supplier information.

**Acceptance Criteria:**

**Given** user navigates to Vendors page
**When** page loads
**Then** system displays all active vendors (deleted=false) in a table
**And** table shows: name, contact name, email, phone
**And** table is keyboard navigable (WCAG 2.1 AA)

#### Story 3.4: Edit Vendor Details

As a user,
I want to edit existing vendor details,
So that I can update contact information.

**Acceptance Criteria:**

**Given** user is viewing vendor list
**When** user clicks "Edit" on a vendor
**Then** system displays pre-filled form with current values
**And** user can modify vendor details
**And** updated_by and updated_at are automatically set

#### Story 3.5: Delete Vendor Record

As a user,
I want to delete vendor records,
So that I can remove vendors no longer used.

**Acceptance Criteria:**

**Given** user is viewing vendor list
**When** user clicks "Delete" on a vendor
**Then** system shows confirmation dialog
**And** upon confirmation, sets deleted=true (soft delete)
**And** vendor no longer appears in vendor list

### Epic 4: Purchase Order Management

End-to-end purchase order workflow with status tracking.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16
**User value:** Users can create POs (from AI suggestions or manually), edit drafts, approve, and export as email-ready messages with status tracking (Draft → Approved → Sent).

#### Story 4.1: Purchase Order Database Schema & Setup

As a developer,
I want to set up the Prisma schema for purchase orders,
So that the system can store POs with line items and status tracking.

**Acceptance Criteria:**

**Given** Prisma is installed and configured
**When** schema.prisma is updated with PurchaseOrder and POItem models
**Then** PurchaseOrder includes: id, po_number, vendor_id, status (Draft/Approved/Sent), created_at, updated_at, created_by, updated_by
**And** POItem includes: id, purchase_order_id, item_name, quantity, unit_price, total
**And** migration runs successfully

#### Story 4.2: Create Purchase Order

As a user,
I want to create purchase orders (manually or with pre-filled data),
So that I can order inventory from vendors.

**Acceptance Criteria:**

**Given** user is on Purchase Orders page or receives pre-filled data
**When** user fills in vendor + line items (or data is pre-filled)
**Then** system validates input with Zod schema
**And** PO is saved with status "Draft"
**And** user sees success toast notification

#### Story 4.3: View Purchase Orders List

As a user,
I want to view all purchase orders with their status,
So that I can track orders in progress.

**Acceptance Criteria:**

**Given** user navigates to Purchase Orders page
**When** page loads
**Then** system displays all POs in a table with: PO number, vendor, status badge, total, date
**And** table is filterable by status (Draft/Approved/Sent)
**And** table is keyboard navigable (WCAG 2.1 AA)

#### Story 4.4: Edit Draft Purchase Orders

As a user,
I want to edit draft purchase orders,
So that I can make changes before approval.

**Acceptance Criteria:**

**Given** user is viewing PO list
**When** user clicks "Edit" on a Draft status PO
**Then** system displays pre-filled form with line items
**And** user can modify vendor, items, quantities, prices
**And** upon save, updated_at and updated_by are set

#### Story 4.5: Approve Purchase Order

As a user,
I want to approve purchase orders,
So that they can be sent to vendors.

**Acceptance Criteria:**

**Given** user is viewing a Draft PO
**When** user clicks "Approve" button
**Then** system changes PO status from Draft to Approved
**And** user sees success toast notification
**And** status badge updates immediately

#### Story 4.6: Export Purchase Order

As a user,
I want to export purchase orders as email-ready messages,
So that I can send them to vendors.

**Acceptance Criteria:**

**Given** user is viewing an Approved PO
**When** user clicks "Export" button
**Then** system generates formatted text/email content with PO details
**And** content is copied to clipboard or downloaded as file
**And** user sees success toast notification

### Epic 5: Dashboard & AI Chat Interface

Real-time insights with conversational AI assistant.
**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24
**User value:** Users see dashboard with low stock alerts, metrics, color-coded indicators, and can ask AI natural language questions for demand predictions and reorder suggestions (human-in-the-loop approval required).

#### Story 5.1: Dashboard Stats API & Data Fetching

As a developer,
I want to create the dashboard data API and Server Actions,
So that the dashboard can display real-time stats and alerts.

**Acceptance Criteria:**

**Given** Prisma schema is set up
**When** `/api/dashboard` route is created
**Then** API returns: total inventory count, low stock count, recent POs
**And** `getDashboardStats()` Server Action is implemented
**And** data is fetched server-side (Server Components)

#### Story 5.2: Dashboard UI with Stats Cards

As a user,
I want to view dashboard with stats cards and low stock alerts,
So that I can quickly assess inventory status.

**Acceptance Criteria:**

**Given** user navigates to Dashboard
**When** page loads
**Then** stats cards display: total items, low stock count, pending POs
**And** color-coded indicators show stock status (red/yellow/green - FR23)
**And** progress bars show stock vs reorder point (FR24)
**And** dashboard meets WCAG 2.1 AA (NFR8)

#### Story 5.3: AI Chat Interface UI

As a user,
I want a chat interface to ask questions about inventory,
So that I can get insights without building complex reports.

**Acceptance Criteria:**

**Given** user is on Dashboard
**When** user opens AI Chat component
**Then** chat interface shows message history
**And** user can type questions and see responses
**And** chat is a Client Component with 'use client' directive

#### Story 5.4: Gemini API Integration

As a developer,
I want to integrate Gemini API with database context for natural language queries,
So that users can ask inventory-related questions with real data context.

**Acceptance Criteria:**

**Given** `GEMINI_API_KEY` is set in environment
**When** `POST /api/ai/chat` is called with user question
**Then** API fetches relevant inventory data from PostgreSQL (via Prisma)
**And** API constructs prompt with user question + data context
**And** API proxies request to Gemini with full context
**And** response returns within 5 seconds (NFR2)
**And** API key is hidden from client (server-side only)

#### Story 5.5: AI Demand Predictions & Reorder Suggestions

As a user,
I want AI to provide demand predictions and reorder suggestions,
So that I know what to order and in what quantities.

**Acceptance Criteria:**

**Given** user asks "What should I reorder?" or similar
**When** AI processes the question
**Then** AI returns suggestions with item names and suggested quantities
**And** suggestions include reasoning (e.g., "Sold 50 last month")
**And** "Create PO" button appears next to suggestions

#### Story 5.6: Human-in-the-Loop Approval for AI

As a user,
I want to approve or modify AI suggestions before creating POs,
So that I maintain control over purchasing decisions.

**Acceptance Criteria:**

**Given** AI provides reorder suggestions
**When** user clicks "Create PO" on a suggestion
**Then** PO form opens with pre-filled vendor and line items
**And** user can modify quantities or items before saving
**And** system requires explicit user action (no auto-creation - FR20)

#### Story 5.7: AI Service Fallback Handling

As a user,
I want the system to gracefully handle AI service failures,
So that I can still use basic inventory metrics when AI is unavailable.

**Acceptance Criteria:**

**Given** Gemini API is unavailable or returns error
**When** user attempts to use AI chat
**Then** system displays "AI is unavailable right now"
**And** basic inventory metrics are shown as fallback (NFR12)
**And** user can still access dashboard and inventory normally

### Epic 6 (Growth/Post-MVP): Data Management & Reporting

Real-time insights with conversational AI assistant.
**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24
**User value:** Users see dashboard with low stock alerts, metrics, color-coded indicators, and can ask AI natural language questions for demand predictions and reorder suggestions (human-in-the-loop approval required).

### Epic 6 (Growth/Post-MVP): Data Management & Reporting

_Phase 2 - Not included in MVP sprints_
**FRs covered:** FR32, FR33, FR34, FR35
**User value:** Users can import/export CSV data and view advanced reports with filtering/sorting.

#### Story 6.1 (Growth/Post-MVP): Export Inventory Data (CSV)

As a user,
I want to export inventory data as CSV,
So that I can backup data or use in spreadsheets.

**Acceptance Criteria:**

**Given** user is on Inventory page
**When** user clicks "Export CSV" button
**Then** system generates CSV with all inventory fields
**And** file downloads automatically
**And** export includes audit fields (created_at, updated_at)

#### Story 6.2 (Growth/Post-MVP): Import Inventory Data (CSV)

As a user,
I want to import inventory data from CSV,
So that I can bulk upload or migrate data.

**Acceptance Criteria:**

**Given** user is on Inventory page
**When** user clicks "Import CSV" and selects file
**Then** system validates CSV format and maps columns
**And** valid rows are inserted/updated in database
**And** user sees import summary (success/failed rows)

#### Story 6.3 (Growth/Post-MVP): View Reports & Analytics

As a user,
I want to view reports and analytics on inventory trends,
So that I can make data-driven decisions.

**Acceptance Criteria:**

**Given** user navigates to Reports page
**When** page loads
**Then** system displays charts: stock levels over time, top-selling items, vendor spend
**And** reports are filterable by date range
**And** charts use accessible color schemes (WCAG 2.1 AA)

#### Story 6.4 (Growth/Post-MVP): Advanced Filtering & Sorting

As a user,
I want to filter and sort inventory data,
So that I can find specific items quickly.

**Acceptance Criteria:**

**Given** user is viewing inventory list
**When** user applies filters (category, stock status, date range)
**Then** table updates to show matching items
**And** user can sort by any column (name, quantity, date)
**And** filters persist in URL params for sharing

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story {{N}}.{{M}}: {{story_title_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}

<!-- End story repeat -->
