# 📊 SIMPLE SQL QUERIES - EXISTING TABLES

## Core Tables (Already Exist)

### 1. PROFILES
```sql
-- Get all users
SELECT * FROM profiles;

-- Get user by email
SELECT * FROM profiles WHERE email = 'user@example.com';

-- Get all branch managers
SELECT * FROM profiles WHERE role = 'branch_manager';

-- Get all sales executives
SELECT * FROM profiles WHERE role = 'sales';
```

### 2. BRANCHES
```sql
-- Get all branches
SELECT * FROM branches;

-- Get branches by owner
SELECT * FROM branches WHERE owner_id = 'user-uuid-here';

-- Get branch with payment status
SELECT * FROM branches WHERE payment_completed = true;
```

### 3. LEADS
```sql
-- Get all leads
SELECT * FROM leads;

-- Get leads by sales executive
SELECT * FROM leads WHERE sales_id = 'user-uuid-here';

-- Get leads by status
SELECT * FROM leads WHERE status = 'new'; -- or 'contacted', 'qualified', 'won', 'lost'

-- Get leads by branch
SELECT * FROM leads WHERE branch_id = 'branch-uuid-here';
```

### 4. BOOKINGS
```sql
-- Get all bookings
SELECT * FROM bookings;

-- Get bookings by branch
SELECT * FROM bookings WHERE branch_id = 'branch-uuid-here';

-- Get confirmed bookings
SELECT * FROM bookings WHERE status = 'confirmed';

-- Get upcoming events
SELECT * FROM bookings WHERE event_date >= CURRENT_DATE ORDER BY event_date;

-- Get bookings with revenue
SELECT branch_id, SUM(total_cost) as total_revenue FROM bookings GROUP BY branch_id;
```

### 5. INVENTORY
```sql
-- Get all inventory
SELECT * FROM inventory;

-- Get inventory by branch
SELECT * FROM inventory WHERE branch_id = 'branch-uuid-here';

-- Get low stock items
SELECT * FROM inventory WHERE quantity < 10;
```

### 6. INVOICES
```sql
-- Get all invoices
SELECT * FROM invoices;

-- Get invoices by booking
SELECT * FROM invoices WHERE booking_id = 'booking-uuid-here';

-- Get paid invoices
SELECT * FROM invoices WHERE payment_status = 'paid';

-- Total revenue
SELECT SUM(amount) as total_revenue FROM invoices WHERE payment_status = 'paid';
```

## New Tables (From production-schema.sql)

### 7. BRANCH_PAYMENTS
```sql
-- Get all payments
SELECT * FROM branch_payments;

-- Get successful payments
SELECT * FROM branch_payments WHERE payment_status = 'success';

-- Get payments by owner
SELECT * FROM branch_payments WHERE owner_id = 'user-uuid-here';
```

### 8. BRANCH_MANAGERS
```sql
-- Get all managers
SELECT * FROM branch_managers;

-- Get manager for a branch
SELECT * FROM branch_managers WHERE branch_id = 'branch-uuid-here';
```

### 9. SALES_EXECUTIVES
```sql
-- Get all sales
SELECT * FROM sales_executives;

-- Get sales by branch
SELECT * FROM sales_executives WHERE branch_id = 'branch-uuid-here';
```

### 10. VENDORS
```sql
-- Get all vendors
SELECT * FROM vendors;

-- Get vendors by branch
SELECT * FROM vendors WHERE branch_id = 'branch-uuid-here';

-- Get vendors by type
SELECT * FROM vendors WHERE vendor_type = 'catering';
```

### 11. FOOD_SUPPLIES
```sql
-- Get all supplies
SELECT * FROM food_supplies;

-- Get supplies by branch
SELECT * FROM food_supplies WHERE branch_id = 'branch-uuid-here';

-- Get low stock supplies
SELECT * FROM food_supplies WHERE quantity <= threshold;
```

### 12. LEAD_CHECKLIST
```sql
-- Get checklist for a lead
SELECT * FROM lead_checklist WHERE lead_id = 'lead-uuid-here';

-- Get leads with advance payment
SELECT * FROM lead_checklist WHERE advance_payment_completed = true;
```

### 13. ACTIVITY_LOGS
```sql
-- Get all activity
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50;

-- Get activity by user
SELECT * FROM activity_logs WHERE user_id = 'user-uuid-here';
```

### 14. NOTIFICATIONS
```sql
-- Get unread notifications
SELECT * FROM notifications WHERE user_id = 'user-uuid-here' AND read = false;

-- Get all notifications
SELECT * FROM notifications WHERE user_id = 'user-uuid-here' ORDER BY created_at DESC;
```

## Useful Joins

```sql
-- Branches with owner details
SELECT b.*, p.full_name, p.email 
FROM branches b
JOIN profiles p ON b.owner_id = p.id;

-- Leads with sales executive details
SELECT l.*, p.full_name as sales_name, p.email as sales_email
FROM leads l
JOIN profiles p ON l.sales_id = p.id;

-- Bookings with branch details
SELECT bk.*, br.name as branch_name, br.city
FROM bookings bk
JOIN branches br ON bk.branch_id = br.id;

-- Branch revenue summary
SELECT 
  br.name as branch_name,
  COUNT(bk.id) as total_bookings,
  SUM(bk.total_cost) as total_revenue,
  AVG(bk.total_cost) as avg_booking_value
FROM branches br
LEFT JOIN bookings bk ON br.id = bk.branch_id
GROUP BY br.id, br.name;

-- Sales executive performance
SELECT 
  p.full_name as sales_name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.status = 'won' THEN 1 END) as won_leads,
  COUNT(CASE WHEN l.status = 'won' THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0) as conversion_rate
FROM profiles p
LEFT JOIN leads l ON p.id = l.sales_id
WHERE p.role = 'sales'
GROUP BY p.id, p.full_name;
```

---

**Note:** Replace 'user-uuid-here', 'branch-uuid-here', 'lead-uuid-here', 'booking-uuid-here' with actual UUIDs from your database.
