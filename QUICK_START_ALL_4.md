# 🚀 QUICK START GUIDE - All 4 Components

## ✅ What You Have Now:

1. **Branch Manager Portal** - Supplies, Vendors, Sales Team, Leads management
2. **Enhanced Leads Page** - 9-step lifecycle with auto-conversion
3. **Production Analytics** - Charts for Owner/Manager/Sales roles
4. **Demo Data Script** - Inject 3 branches with realistic data

---

## 🎯 3-MINUTE SETUP

### Step 1: Run Database Migration (1 minute)
```bash
# 1. Open: https://app.supabase.com
# 2. Select your project
# 3. Click "SQL Editor" in left sidebar
# 4. Create new query
# 5. Copy ENTIRE content from: scripts/production-schema.sql
# 6. Paste and click "Run" (green play button)
# 7. Wait for "Success. No rows returned"
```

### Step 2: Start Development Server (30 seconds)
```bash
cd /Users/divesh/Downloads/eventease
npm run dev
```

### Step 3: Test New Pages (1.5 minutes)

**Option A: Access Pages Directly**
```
http://localhost:3000/dashboard/branch-manager-portal
http://localhost:3000/dashboard/leads-lifecycle
http://localhost:3000/dashboard/analytics-production
```

**Option B: Add Navigation Links**
Update your sidebar to include:
- Branch Manager Portal
- Leads Lifecycle
- Production Analytics

---

## 📊 Simple Query Examples

All queries are straightforward - NO COMPLEX JOINS!

```sql
-- Get supplies
SELECT * FROM food_supplies WHERE branch_id = 'your-branch-id';

-- Get low stock
SELECT * FROM food_supplies WHERE quantity <= threshold;

-- Get leads
SELECT * FROM leads WHERE sales_id = 'your-user-id';

-- Get bookings revenue
SELECT SUM(total_cost) FROM bookings WHERE branch_id = 'your-branch-id';
```

See full list in: `SIMPLE_SQL_QUERIES.md`

---

## 🎨 Key Features

### Branch Manager Portal (`/dashboard/branch-manager-portal`)
✅ **Supplies Tab:**
- View all inventory items
- Color-coded: Red (low stock) / Green (healthy)
- Low stock alert banner
- Update quantities inline
- Add new items

✅ **Vendors Tab:**
- 6 vendor types (catering, decoration, photography, etc.)
- Add vendor dialog
- Contact details display

✅ **Sales Team Tab:**
- Add sales by email
- View team members
- Track assignments

✅ **Leads Tab:**
- View all branch leads
- See sales executive names
- Track statuses

### Enhanced Leads Page (`/dashboard/leads-lifecycle`)
✅ **9-Step Checklist:**
1. ☐ Call
2. ☐ Property Visit
3. ☐ Food Tasting
4. ☐ **Advance Payment** (Auto-converts!)
5. ☐ Menu Finalized
6. ☐ Decoration Finalized
7. ☐ Full Payment
8. ☐ Post-Event Settlement
9. ☐ Feedback

✅ **Features:**
- Progress bar (0-100%)
- Checkbox for each step
- Date tracking
- Payment collection dialogs
- Visual checkmarks

### Production Analytics (`/dashboard/analytics-production`)
✅ **Owner View:**
- Revenue per branch (Bar Chart)
- Conversion rate comparison (Bar Chart)
- Monthly trend (Line Chart)
- Inventory health (Stacked Bar)

✅ **Manager View:**
- Sales leaderboard (Bar Chart)
- Conversion rates (Bar Chart)
- Revenue by sales (Bar Chart)
- Monthly trend (Line Chart)

✅ **Sales View:**
- 4 stat cards (Leads, Won, Rate, Revenue)
- Leads funnel (Pie Chart)

### Demo Data Script (`scripts/inject-demo-data.ts`)
✅ **Creates:**
- 3 branches (Mumbai, Andheri, Thane)
- 5 vendors per branch
- 6 supplies per branch (mix of low/healthy stock)
- 30 leads per branch
- 15 bookings per branch

---

## 🐛 Troubleshooting

**Error: "relation does not exist"**
→ Run the database migration (Step 1 above)

**Error: "No branch assigned"**
→ Branch Manager needs `branch_id` in profiles table
→ Or test from `/dashboard/branches-enhanced` first

**Charts not showing data**
→ Run demo data injection script
→ Or create manual test data

**Permission denied**
→ RLS policies need to match user role
→ Check `profiles.role` is set correctly

---

## 📱 Navigation Setup (Optional)

Add to your sidebar component:

```tsx
{
  title: 'Branch Manager Portal',
  href: '/dashboard/branch-manager-portal',
  icon: Package,
  badge: 'New'
},
{
  title: 'Leads Lifecycle',
  href: '/dashboard/leads-lifecycle',
  icon: CheckCircle,
  badge: 'New'
},
{
  title: 'Production Analytics',
  href: '/dashboard/analytics-production',
  icon: BarChart3,
  badge: 'New'
}
```

---

## 🎯 Demo Flow for Hackathon

### 1. Show Branch Purchase (2 min)
```
1. Navigate to /dashboard/branches-enhanced
2. Click "Add Branch"
3. Fill details (Mumbai Central, 500 capacity)
4. Click "Proceed to Payment"
5. Enter card: 4111 1111 1111 1111
6. Show success animation
7. Branch appears in grid with stats
```

### 2. Show Manager Portal (3 min)
```
1. Navigate to /dashboard/branch-manager-portal
2. Show stats cards
3. Open Supplies tab
4. Point out RED items (low stock)
5. Update quantity
6. Show GREEN change
7. Add new vendor
8. Add sales executive
```

### 3. Show Sales Lifecycle (3 min)
```
1. Navigate to /dashboard/leads-lifecycle
2. Show lead with progress bar (30%)
3. Check off "Call Completed"
4. Check off "Property Visit"
5. Click "Collect" on Advance Payment
6. Enter ₹50,000
7. Show auto-conversion message
8. Progress bar updates to 50%
```

### 4. Show Analytics (2 min)
```
1. Navigate to /dashboard/analytics-production
2. Show revenue bar chart
3. Show conversion rate comparison
4. Show monthly trend line
5. Show inventory health (red/green bars)
```

**Total Demo Time: 10 minutes** ✅

---

## 🎉 You're Ready!

Everything is production-grade and ready to showcase:

✅ Database schema with RLS
✅ All 4 major components
✅ Simple queries (no complexity)
✅ Beautiful UI with animations
✅ Real-time data loading
✅ Demo data injection script
✅ Complete documentation

**Files Created:**
- `app/dashboard/branch-manager-portal/page.tsx` (600 lines)
- `app/dashboard/leads-lifecycle/page.tsx` (700 lines)
- `app/dashboard/analytics-production/page.tsx` (500 lines)
- `scripts/inject-demo-data.ts` (300 lines)
- `scripts/production-schema.sql` (500 lines)
- `SIMPLE_SQL_QUERIES.md` (Complete reference)
- `ALL_4_COMPONENTS_COMPLETE.md` (Full guide)

**Total: 2600+ lines of production code!** 🚀

Good luck with your hackathon! 🎯
