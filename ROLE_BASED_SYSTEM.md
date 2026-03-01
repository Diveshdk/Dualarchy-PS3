# Role-Based System & Real-Time Features

## Overview

The Banquet Management System now features a comprehensive role-based access control system with real-time data synchronization. Users select their role during registration, which determines their dashboard, features, and permissions.

## User Roles

### 1. Owner (Branch Owner)
**Registration**: Select "Owner (Manage branches and bookings)"

**Permissions**:
- Create and manage multiple branches
- View all bookings across branches
- Access branch comparison analytics
- Set branch priorities for auto-routing
- Manage supply inventory
- View detailed event analysis and AI insights
- Generate PDF reports
- Access all dashboard pages

**Dashboard Access**:
- Main Dashboard (overview)
- Leads Management
- Bookings List
- Invoices
- Inventory Management
- Branch Comparison
- Branch Priority Settings
- Supply Management
- Event Analysis
- Features Guide
- Settings

### 2. Branch Manager (Calendar Manager)
**Registration**: Select "Branch Manager (Manage branch calendar)"

**Permissions**:
- Manage booking calendar for assigned branch
- Add, view, and edit bookings
- Prevent double bookings with real-time validation
- View booking statistics
- Access calendar notifications
- Limited to single branch only

**Dashboard Access**:
- Branch Manager Dashboard (exclusive)
- Real-time Booking Calendar
- Double-booking prevention system
- Branch occupancy statistics

**Key Features**:
- Interactive calendar with drag-and-drop (planned)
- Real-time synchronization
- Automatic conflict detection
- Color-coded availability (Green/Amber/Red)
- Booking details popup

### 3. Sales (Sales Representative)
**Registration**: Select "Sales (Create leads and bookings)"

**Permissions**:
- Create and manage leads
- Convert leads to bookings
- View assigned bookings
- Track lead status
- Limited to leads and bookings management

**Dashboard Access**:
- Dashboard (leads overview)
- Leads Management
- Create Bookings

## Registration Process

### Step-by-Step Sign Up

1. **Navigate to Sign Up**: `/auth/sign-up`

2. **Fill in Personal Information**:
   - First Name (required)
   - Last Name (required)
   - Email (required)
   - Password (min. 8 characters)
   - Confirm Password

3. **Select Role** (required):
   ```
   Owner
   Branch Manager
   Sales
   ```

4. **Create Account**:
   - Validates all fields
   - Creates user in Supabase Auth
   - Automatically creates profile with selected role
   - Sends verification email

5. **Email Verification**:
   - Check your email for verification link
   - Click to verify account
   - Proceed to login

### Sample Credentials for Testing

You can test all three roles:

**Owner Account**:
- Email: owner@example.com
- First Name: John
- Last Name: Owner
- Role: Owner

**Branch Manager Account**:
- Email: manager@example.com
- First Name: Sarah
- Last Name: Manager
- Role: Branch Manager

**Sales Account**:
- Email: sales@example.com
- First Name: Mike
- Last Name: Sales
- Role: Sales

## Real-Time Features

### 1. Real-Time Booking Calendar

**Location**: Dashboard > Branch Manager

**Features**:
- Live calendar synchronized across all devices
- Real-time booking updates via Supabase Realtime
- Instant double-booking detection
- Color-coded hall availability:
  - **Green**: Hall available for booking
  - **Amber**: 1 booking exists
  - **Red**: Multiple bookings (potential conflicts)

**Double Booking Prevention**:
```
When attempting to add a booking:
1. Check if hall is available at specific time
2. Prevent booking if conflict exists
3. Show warning message
4. Block submission until conflict is resolved
```

### 2. Real-Time Synchronization

All updates are synced in real-time:

- **Bookings**: New, updated, or cancelled bookings
- **Leads**: Lead creation, status changes, conversions
- **Inventory**: Supply additions, updates, removals
- **Branches**: Branch info changes

**Technical Implementation**:
```typescript
// Using Supabase Realtime
const { isConnected } = useRealtimeBookings(branchId, {
  onNew: (booking) => { /* Handle new booking */ },
  onUpdated: (booking) => { /* Handle update */ },
  onCancelled: (booking) => { /* Handle cancellation */ }
})
```

### 3. Real-Time Hooks

Available hooks for implementing real-time features:

```typescript
import {
  useRealtime,
  useRealtimeBookings,
  useRealtimeLeads,
  useRealtimeInventory
} from '@/hooks/use-real-time'
```

**useRealtimeBookings**:
```typescript
const { isConnected } = useRealtimeBookings(branchId, {
  onNew: (booking) => console.log('New booking:', booking),
  onUpdated: (booking) => console.log('Updated:', booking),
  onCancelled: (booking) => console.log('Cancelled:', booking)
})
```

**useRealtimeLeads**:
```typescript
const { isConnected } = useRealtimeLeads(branchId, {
  onNew: (lead) => console.log('New lead:', lead),
  onUpdated: (lead) => console.log('Updated:', lead),
  onClosed: (lead) => console.log('Closed:', lead)
})
```

## Database Schema with Roles

### profiles table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'branch_manager', 'sales')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Row-Level Security (RLS)

Each table has RLS policies enforcing role-based access:

**Branches**: Owner can only view their own branches
**Leads**: Sales can only view leads they created
**Bookings**: Access based on branch ownership or assignment
**Inventory**: Access based on branch ownership

## Workflow Examples

### Example 1: Owner Creating a Branch

1. Log in as Owner
2. Navigate to Branches
3. Click "Add Branch"
4. Fill in branch details:
   - Name
   - Address
   - City
   - Capacity
5. Save branch

### Example 2: Branch Manager Managing Calendar

1. Log in as Branch Manager
2. Navigate to "Branch Manager" (exclusive tab)
3. View real-time calendar
4. Click "Add Booking" button
5. Fill in booking details:
   - Client Name
   - Email, Phone
   - Event Date & Time
   - Hall Name
   - Guest Count
6. System checks for double bookings
7. If conflict exists, shows warning
8. If clear, booking is created
9. Calendar updates in real-time

### Example 3: Sales Creating a Lead

1. Log in as Sales
2. Navigate to Leads
3. Click "Add Lead"
4. Fill in prospect information
5. Save lead
6. Track status through sales pipeline
7. Convert to booking when ready

## Security Features

### 1. Authentication
- Supabase Auth with email verification
- Role stored securely in user metadata
- Session management with HTTP-only cookies

### 2. Row-Level Security (RLS)
- Database-level access control
- Enforced for all tables
- Role-based policies

### 3. Data Validation
- Client-side validation on forms
- Server-side validation on API routes
- Type-safe database operations

## Testing the System

### Test Owner Account
```
1. Sign up as Owner
2. Create a new branch
3. Add multiple bookings
4. View analytics and reports
```

### Test Branch Manager Account
```
1. Sign up as Branch Manager
2. Navigate to Branch Manager dashboard
3. View real-time calendar
4. Try to add double booking (should fail)
5. Add valid booking
6. Refresh page - booking should persist
```

### Test Sales Account
```
1. Sign up as Sales
2. Create leads
3. Update lead status
4. Convert to booking
```

## Troubleshooting

### Real-Time Updates Not Working

1. Check internet connection
2. Verify Supabase is connected
3. Check browser console for errors
4. Ensure user has proper RLS permissions

### Can't Access Role-Specific Pages

1. Log out and log back in
2. Verify your role during signup
3. Check `profiles` table for correct role
4. Ensure you're in correct dashboard path

### Double Booking Still Allowing Conflicts

1. Ensure both bookings have same:
   - event_date
   - event_time
   - hall_name
2. Check that bookings table has status='confirmed'
3. Verify real-time connection is active

## Future Enhancements

- [ ] Branch assignment for managers (admin feature)
- [ ] Drag-and-drop calendar editing
- [ ] Booking templates
- [ ] Advanced conflict resolution
- [ ] Multi-branch permission levels
- [ ] Custom role creation for admins
- [ ] Audit logs for compliance
- [ ] Role-based export options

## Support

For issues or questions:
1. Check the Features Guide in the dashboard
2. Review logs in browser console
3. Verify Supabase connectivity
4. Contact support with role and steps to reproduce
