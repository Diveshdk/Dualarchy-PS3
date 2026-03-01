# 🎯 PROJECT FLOW VISUALIZATION

## Complete User Journey - Banquet Management System

```
╔════════════════════════════════════════════════════════════════════════╗
║                          LANDING & AUTHENTICATION                       ║
╚════════════════════════════════════════════════════════════════════════╝

    START: https://localhost:3000
           │
           ├─ Not Authenticated
           │  │
           │  └──> Redirects to /auth/login
           │                │
           │                ├─ New User? → Go to /auth/sign-up
           │                │              │
           │                │              ├─ Fill Form:
           │                │              │  ✓ First Name
           │                │              │  ✓ Last Name
           │                │              │  ✓ Email
           │                │              │  ✓ Password (min 8 chars)
           │                │              │  ✓ Role: [Owner/Branch Manager/Sales]
           │                │              │
           │                │              └─> Sign Up Success
           │                │                  └─> Email Verification
           │                │                      └─> Back to Login
           │                │
           │                └─ Existing User → Login
           │                                   │
           │                                   └─> Enter Credentials
           │                                       └─> Authenticate
           │
           └─ Authenticated
              │
              └──> Redirects to /dashboard


╔════════════════════════════════════════════════════════════════════════╗
║                        ROLE-BASED DASHBOARD ACCESS                      ║
╚════════════════════════════════════════════════════════════════════════╝

                          /dashboard (Main Entry)
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                  OWNER     BRANCH MGR      SALES
                    │            │            │
        ┌───────────┼────────┐   │   ┌───────┼────────┐
        │           │        │   │   │       │        │
    Full Access  Analytics  │   │   │   Leads Only   │
        │       Reports  Branches │   │   Bookings    │
        │           │        │   │   │   (Limited)    │
        │           │        │   │   │                │
        │           │        │   │   └────────────────┘
        │           │        │   │
        │           │        │   └──> Branch Manager Calendar
        │           │        │        ✓ Real-time booking
        │           │        │        ✓ Double-booking prevention
        │           │        │        ✓ Interactive calendar
        │           │        │        ✓ Live statistics
        │           │        │
        │           │        └──> All Branch Management
        │           │             ✓ Create/Edit branches
        │           │             ✓ Set priorities
        │           │             ✓ View analytics
        │           │
        └───────────┴──────────> Complete Feature Access
                                 (See feature tree below)


╔════════════════════════════════════════════════════════════════════════╗
║                          MAIN FEATURE TREE (OWNER)                      ║
╚════════════════════════════════════════════════════════════════════════╝

/dashboard (Home)
│
├─ 📊 Dashboard Overview
│  ├─ Real-time Statistics
│  │  ✓ Total Leads
│  │  ✓ Total Bookings
│  │  ✓ Total Revenue
│  │  ✓ Conversion Rate
│  │  ✓ Low Stock Alerts
│  │
│  ├─ Quick Actions
│  │  ✓ Add Lead
│  │  ✓ New Booking
│  │  ✓ View Calendar
│  │
│  ├─ Notifications Center 🔔
│  │  ✓ Low stock alerts
│  │  ✓ New leads
│  │  ✓ Booking confirmations
│  │  ✓ System updates
│  │
│  ├─ Recent Bookings Widget
│  ├─ Upcoming Events Widget
│  └─ Quick Reference Panel
│
├─ 👥 Leads (/dashboard/leads)
│  ├─ Kanban Board View
│  │  ├─ New Leads
│  │  ├─ Contacted
│  │  ├─ Negotiating
│  │  ├─ Converted
│  │  └─ Lost
│  │
│  ├─ Add New Lead
│  │  ✓ Customer details
│  │  ✓ Event type
│  │  ✓ Expected guests
│  │  ✓ Budget estimate
│  │  ✓ Preferred date
│  │  ✓ Branch selection
│  │
│  ├─ Drag & Drop Status Update
│  ├─ Lead Details Modal
│  ├─ Convert to Booking
│  └─ Real-time Sync
│
├─ 📅 Bookings (/dashboard/bookings)
│  ├─ Booking List Table
│  │  ✓ Customer info
│  │  ✓ Event details
│  │  ✓ Date & time
│  │  ✓ Hall assignment
│  │  ✓ Guest count
│  │  ✓ Amount
│  │  ✓ Status
│  │
│  ├─ Add New Booking
│  │  ✓ Customer details
│  │  ✓ Event type
│  │  ✓ Hall selection
│  │  ✓ Date & time picker
│  │  ✓ Guest count
│  │  ✓ Amount
│  │  ✓ Special requirements
│  │
│  ├─ Filter & Search
│  ├─ Export to PDF/Excel
│  └─ Real-time Updates
│
├─ ⏰ Branch Manager Calendar (/dashboard/branch-manager) ★★★
│  ├─ Interactive Monthly Calendar
│  │  ✓ Click any date
│  │  ✓ Color-coded occupancy
│  │  ✓ Hover for details
│  │
│  ├─ Add Booking (In-Calendar)
│  │  ✓ Quick booking form
│  │  ✓ Hall selection
│  │  ✓ Time slots
│  │  ✓ Guest count
│  │
│  ├─ Double-Booking Prevention ★
│  │  ✓ Automatic conflict detection
│  │  ✓ Clear warning messages
│  │  ✓ Alternative time suggestions
│  │
│  ├─ Real-time Synchronization ★
│  │  ✓ Multi-device sync
│  │  ✓ Instant updates
│  │  ✓ No refresh needed
│  │
│  ├─ Statistics Dashboard
│  │  ✓ Total bookings
│  │  ✓ Upcoming events
│  │  ✓ Occupancy rate
│  │  ✓ Average guests
│  │
│  └─ Booking Details Modal
│
├─ 🏢 Branches (/dashboard/branches)
│  ├─ Branch Cards Grid
│  │  ✓ Branch name & location
│  │  ✓ Hall capacity
│  │  ✓ Total bookings
│  │  ✓ Total revenue
│  │  ✓ Conversion rate
│  │
│  ├─ AI Branch Comparison ★★★ 🤖
│  │  ✓ Click "AI Analysis"
│  │  ✓ Top performers identified
│  │  ✓ Underperforming branches
│  │  ✓ Growth recommendations
│  │  ✓ Staffing suggestions
│  │  ✓ Scaling strategies
│  │
│  ├─ Add New Branch
│  │  ✓ Name & address
│  │  ✓ City & state
│  │  ✓ Phone & email
│  │  ✓ Hall configuration
│  │  ✓ Capacity details
│  │
│  ├─ Edit Branch Details
│  └─ Branch Performance Charts
│
├─ 🎯 Branch Priority (/dashboard/branch-priority) ★★★
│  ├─ Priority List View
│  │  ✓ Current priority order
│  │  ✓ Drag to reorder (or use arrows)
│  │  ✓ Branch details
│  │
│  ├─ Smart Recommendation Engine ★ 🤖
│  │  ├─ Test Input:
│  │  │  ✓ Guest count
│  │  │  ✓ Budget
│  │  │  ✓ Date preference
│  │  │
│  │  ├─ AI Recommendation:
│  │  │  ✓ Primary branch (why?)
│  │  │  ✓ Backup options (if full)
│  │  │  ✓ Price comparison
│  │  │  ✓ Unique features explained
│  │  │  ✓ Availability status
│  │  │
│  │  └─ View Details → Branch info
│  │
│  └─ Save Priority Order
│
├─ ✨ Supplies (/dashboard/supplies) ★★
│  ├─ Branch Selector
│  │
│  ├─ Supply Items List
│  │  ├─ Color-Coded Status:
│  │  │  🔴 Critical (≤25%)
│  │  │  🟠 Low (26-50%)
│  │  │  🟡 Medium (51-100%)
│  │  │  🟢 Healthy (100%+)
│  │  │
│  │  ├─ Item Details:
│  │  │  ✓ Item name
│  │  │  ✓ Current quantity
│  │  │  ✓ Threshold level
│  │  │  ✓ Percentage available
│  │  │  ✓ Last restocked date
│  │  │
│  │  └─ Critical Items Banner
│  │     (Shown at top if any critical)
│  │
│  ├─ Low Stock Notifications 🔔
│  │  ✓ Auto popup alerts
│  │  ✓ Bell icon indicator
│  │  ✓ Click to view details
│  │
│  ├─ Add New Supply Item
│  │  ✓ Item name
│  │  ✓ Initial quantity
│  │  ✓ Threshold level
│  │  ✓ Branch assignment
│  │
│  ├─ Update Stock Levels
│  └─ Restock History
│
├─ 🤖 Event Analysis (/dashboard/event-analysis) ★★★
│  ├─ Event Selector
│  │  ✓ Dropdown of past events
│  │  ✓ Event date & type
│  │
│  ├─ AI Analysis Generation ★ 🤖
│  │  ├─ Click "Analyze Event"
│  │  │  → Gemini AI processes
│  │  │
│  │  ├─ Performance Metrics:
│  │  │  ✓ Planning efficiency score
│  │  │  ✓ Execution quality score
│  │  │  ✓ Guest satisfaction estimate
│  │  │
│  │  ├─ Revenue Analysis:
│  │  │  ✓ Total revenue
│  │  │  ✓ Cost per head
│  │  │  ✓ Profit margin
│  │  │  ✓ ROI calculation
│  │  │
│  │  ├─ Recommendations:
│  │  │  ✓ Guest experience tips
│  │  │  ✓ Logistics optimization
│  │  │  ✓ Cost reduction ideas
│  │  │  ✓ Upsell opportunities
│  │  │
│  │  └─ Detailed Analysis Report
│  │     (Multi-paragraph insights)
│  │
│  ├─ Export Report as PDF
│  ├─ Historical Comparison
│  └─ Trend Analysis
│
├─ 📦 Inventory (/dashboard/inventory)
│  ├─ Equipment List
│  │  ✓ Item name & category
│  │  ✓ Total quantity
│  │  ✓ Available quantity
│  │  ✓ In-use quantity
│  │  ✓ Status
│  │
│  ├─ Add Inventory Item
│  ├─ Track Usage
│  ├─ Maintenance Schedule
│  └─ Availability Calendar
│
├─ 💰 Invoices (/dashboard/invoices)
│  ├─ Invoice List
│  │  ✓ Invoice number
│  │  ✓ Customer name
│  │  ✓ Booking reference
│  │  ✓ Amount
│  │  ✓ Payment status
│  │  ✓ Due date
│  │
│  ├─ Generate New Invoice
│  │  ✓ Link to booking
│  │  ✓ Itemized breakdown
│  │  ✓ Tax calculation
│  │  ✓ Payment terms
│  │
│  ├─ Payment Tracking
│  ├─ Export to PDF
│  └─ Financial Reports
│
├─ 📊 Analytics (/dashboard/analytics)
│  ├─ Revenue Dashboard
│  │  ✓ Monthly trends
│  │  ✓ Year-over-year comparison
│  │  ✓ Revenue by branch
│  │  ✓ Revenue by event type
│  │
│  ├─ Booking Analytics
│  │  ✓ Booking patterns
│  │  ✓ Peak seasons
│  │  ✓ Average guest count
│  │  ✓ Popular event types
│  │
│  ├─ Lead Conversion
│  │  ✓ Conversion funnel
│  │  ✓ Win rate by stage
│  │  ✓ Lost reason analysis
│  │
│  └─ Performance Metrics
│     ✓ Branch comparison
│     ✓ Staff performance
│     ✓ Occupancy rates
│
├─ ❓ Features Guide (/dashboard/features-guide)
│  ├─ Quick Start Guide
│  ├─ Feature Tutorials
│  ├─ Video Walkthroughs
│  ├─ FAQ Section
│  └─ Help Resources
│
└─ ⚙️ Settings (/dashboard/settings)
   ├─ Profile Settings
   │  ✓ Personal info
   │  ✓ Contact details
   │  ✓ Profile picture
   │
   ├─ Notification Preferences
   │  ✓ Email notifications
   │  ✓ Push notifications
   │  ✓ Alert types
   │
   ├─ Security Settings
   │  ✓ Change password
   │  ✓ Two-factor auth
   │  ✓ Active sessions
   │
   ├─ Branch Settings
   │  ✓ Default branch
   │  ✓ Branch access
   │
   └─ 🚪 Logout Button
      → Signs out user
      → Redirects to /auth/login


╔════════════════════════════════════════════════════════════════════════╗
║                          REAL-TIME FEATURES                             ║
╚════════════════════════════════════════════════════════════════════════╝

    🔄 REAL-TIME SYNCHRONIZATION (Powered by Supabase)

    Leads
    ├─ New lead added → Appears in all open windows
    ├─ Status changed → Updates across all users
    └─ Lead converted → Real-time notification

    Bookings
    ├─ New booking → Instant calendar update
    ├─ Booking edited → All views refresh
    ├─ Booking cancelled → Immediate removal
    └─ Double-booking attempt → Instant conflict warning

    Supplies
    ├─ Stock level change → Live update
    ├─ Critical threshold → Popup notification
    └─ Restock recorded → Status color changes

    Notifications
    ├─ Bell icon badge → Live count update
    ├─ New notification → Toast popup
    └─ Notification read → Badge decrements


╔════════════════════════════════════════════════════════════════════════╗
║                          AI-POWERED FEATURES                            ║
╚════════════════════════════════════════════════════════════════════════╝

    🤖 GEMINI AI INTEGRATION

    1. Event Analysis
       Input: Past event data (guests, revenue, type, feedback)
       Output: 
       ├─ Performance scores (planning, execution, quality)
       ├─ Revenue analysis (per-head cost, profit margin, ROI)
       ├─ Guest experience recommendations
       ├─ Logistics optimization tips
       └─ PDF report generation

    2. Branch Comparison
       Input: All branches data (bookings, revenue, conversion)
       Output:
       ├─ Top performer identification + WHY
       ├─ Underperforming branch analysis
       ├─ Growth opportunity recommendations
       ├─ Staffing optimization suggestions
       └─ Scaling strategies

    3. Smart Branch Recommendation
       Input: Guest count, budget, date, preferences
       Output:
       ├─ Primary branch recommendation + reasoning
       ├─ Backup options (if primary unavailable)
       ├─ Price comparison across branches
       ├─ Unique features highlighted
       └─ Availability confirmation


╔════════════════════════════════════════════════════════════════════════╗
║                        DOUBLE-BOOKING PREVENTION                        ║
╚════════════════════════════════════════════════════════════════════════╝

    📅 CONFLICT DETECTION LOGIC

    When adding a booking:
    
    1. User selects:
       ├─ Hall: "Grand Hall"
       ├─ Date: "March 15, 2026"
       └─ Time: "6:00 PM"

    2. System checks existing bookings:
       Query: Same hall + Same date + Overlapping time?

    3. Conflict detected?
       ├─ YES → ⛔ Show warning modal
       │        "Grand Hall is already booked at 6:00 PM"
       │        Suggest alternative times: 7:00 PM, 8:00 PM
       │        Prevent booking creation
       │
       └─ NO → ✅ Allow booking
                Add to database
                Update calendar
                Sync across all clients


╔════════════════════════════════════════════════════════════════════════╗
║                          AUTHENTICATION FLOW                            ║
╚════════════════════════════════════════════════════════════════════════╝

    🔐 COMPLETE AUTH JOURNEY

    Sign Up → Email Verification → Login → Dashboard

    Step 1: Sign Up
    ├─ User fills form with role selection
    ├─ Password validation (min 8 chars)
    ├─ Email uniqueness check
    └─ Create user in Supabase Auth

    Step 2: Email Verification
    ├─ Supabase sends verification email
    ├─ User clicks link
    └─ Email confirmed

    Step 3: Login
    ├─ User enters credentials
    ├─ Supabase validates
    ├─ JWT token generated
    └─ User session created

    Step 4: Authorized Access
    ├─ middleware.ts checks auth
    ├─ Role-based permissions applied
    └─ Dashboard rendered

    Step 5: Logout
    ├─ User clicks logout button (top-right or sidebar)
    ├─ Server action: signOut() called
    ├─ Supabase clears session
    ├─ JWT token invalidated
    └─ Redirect to /auth/login


╔════════════════════════════════════════════════════════════════════════╗
║                        DATA FLOW ARCHITECTURE                           ║
╚════════════════════════════════════════════════════════════════════════╝

    User Action → Client Component → Server Action → Supabase → Real-time

    Example: Adding a Lead

    1. User clicks "Add Lead"
       └─ Client: new-lead-dialog.tsx opens

    2. User fills form & submits
       └─ Client: Form validation

    3. Form calls server action
       └─ Server: lib/server-actions.ts → createLead()

    4. Server inserts to database
       └─ Supabase: INSERT into leads table

    5. Database triggers real-time event
       └─ Supabase: Broadcasts "INSERT" event

    6. All subscribed clients receive update
       └─ Client: useRealtimeLeads() hook updates state

    7. UI updates automatically
       └─ Client: Lead appears in Kanban board


╔════════════════════════════════════════════════════════════════════════╗
║                          TECH STACK OVERVIEW                            ║
╚════════════════════════════════════════════════════════════════════════╝

    FRONTEND
    ├─ Next.js 14 (App Router)
    ├─ TypeScript (Type safety)
    ├─ React 18 (Server & Client Components)
    ├─ Tailwind CSS (Styling)
    ├─ Framer Motion (Animations)
    └─ shadcn/ui (Component library)

    BACKEND
    ├─ Next.js Server Actions (API layer)
    ├─ Supabase (Backend-as-a-Service)
    │  ├─ PostgreSQL (Database)
    │  ├─ Real-time subscriptions
    │  ├─ Row-Level Security
    │  └─ Authentication
    └─ Google Gemini AI (Intelligence)

    DEPLOYMENT
    ├─ Vercel (Hosting)
    ├─ Supabase Cloud (Database)
    └─ Environment Variables (Config)


═══════════════════════════════════════════════════════════════════════════

🎯 HACKATHON SHOWCASE STRATEGY

Focus on these 3 "WOW" features:
  1. 🤖 AI Event Analysis - Show intelligence
  2. 🎯 Smart Branch Priority - Show automation
  3. ⚡ Real-time Double-booking Prevention - Show tech excellence

═══════════════════════════════════════════════════════════════════════════
