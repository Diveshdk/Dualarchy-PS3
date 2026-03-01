# Real-Time System Architecture & Implementation Guide

## Overview

The Banquet Management System uses **Supabase Realtime** to provide live, synchronized data across all connected clients. Changes made by any user are instantly reflected on all devices without page refresh.

## How Real-Time Works

### Architecture

```
User 1 (Browser)
      ↓
    [Create Booking]
      ↓
   Supabase DB
      ↓
Realtime Channel
      ↓
User 2 (Browser) ← Instant Update (No Refresh Needed)
User 3 (Browser) ← Instant Update (No Refresh Needed)
```

### Technology Stack

- **Supabase Realtime**: WebSocket-based pub/sub system
- **PostgreSQL**: Underlying database with `listen/notify`
- **React Hooks**: `useRealtime` custom hooks
- **Real-time Channels**: Filtered subscriptions per table/branch

## Real-Time Components

### 1. Booking Calendar (Real-Time)

**File**: `/components/dashboard/booking-calendar.tsx`

**Features**:
- Live calendar updates
- Real-time booking additions
- Instant double-booking detection
- Color-coded occupancy (Green/Amber/Red)

**Implementation**:

```typescript
// Subscribe to bookings for this branch
const subscription = supabase
  .channel(`bookings:${branchId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: `branch_id=eq.${branchId}`,
    },
    () => {
      // Refetch bookings when any change detected
      fetchBookings()
    }
  )
  .subscribe()
```

### 2. Real-Time Hooks

**File**: `/hooks/use-real-time.ts`

**Available Hooks**:

#### useRealtime (Generic)
```typescript
import { useRealtime } from '@/hooks/use-real-time'

const { isConnected } = useRealtime({
  table: 'bookings',
  filter: `branch_id=eq.${branchId}`,
  onInsert: (data) => console.log('New booking:', data),
  onUpdate: (data) => console.log('Updated:', data),
  onDelete: (data) => console.log('Cancelled:', data),
})
```

#### useRealtimeBookings
```typescript
import { useRealtimeBookings } from '@/hooks/use-real-time'

const { isConnected } = useRealtimeBookings(branchId, {
  onNew: (booking) => { /* Handle new */ },
  onUpdated: (booking) => { /* Handle update */ },
  onCancelled: (booking) => { /* Handle cancel */ }
})
```

#### useRealtimeLeads
```typescript
import { useRealtimeLeads } from '@/hooks/use-real-time'

const { isConnected } = useRealtimeLeads(branchId, {
  onNew: (lead) => { /* Handle new lead */ },
  onUpdated: (lead) => { /* Update lead */ },
  onClosed: (lead) => { /* Lead closed */ }
})
```

#### useRealtimeInventory
```typescript
import { useRealtimeInventory } from '@/hooks/use-real-time'

const { isConnected } = useRealtimeInventory(branchId, {
  onNew: (item) => { /* New item */ },
  onUpdated: (item) => { /* Item updated */ },
  onRemoved: (item) => { /* Item removed */ }
})
```

## Double-Booking Prevention

### How It Works

1. **User A** tries to book "Main Hall" on March 15 at 6:00 PM
2. **System checks**: Is this time/hall already booked?
3. **If Yes**: Show warning, prevent submission
4. **If No**: Allow booking, update all connected clients in real-time

### Implementation

```typescript
// Check for double bookings
const checkDoubleBooking = (date: string, time: string, hall: string) => {
  const existingBooking = bookings.find(
    (b) => 
      b.event_date === date && 
      b.event_time === time && 
      b.hall_name === hall
  )
  return existingBooking ? 'This hall is already booked!' : null
}

// On form submission
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Check first
  const warning = checkDoubleBooking(
    formData.event_date,
    formData.event_time,
    formData.hall_name
  )
  
  if (warning) {
    showWarning(warning)
    return // Don't submit
  }
  
  // Submit booking
  await createBooking(formData)
}
```

## Color-Coded Occupancy System

### Calendar Colors Explained

| Color | Meaning | Occupancy |
|-------|---------|-----------|
| **Green** | Available | 0 bookings |
| **Amber** | Partially Booked | 1 booking |
| **Red** | Multiple Bookings | 2+ bookings |

### Implementation

```typescript
const getHallColor = (hallName: string, dateStr: string) => {
  const hallBookings = bookings.filter(
    (b) => b.event_date === dateStr && b.hall_name === hallName
  )
  
  if (hallBookings.length >= 2) return 'bg-rose-100 text-rose-900' // Red
  if (hallBookings.length === 1) return 'bg-amber-100 text-amber-900' // Amber
  return 'bg-emerald-100 text-emerald-900' // Green
}
```

## Setting Up Real-Time in Your Component

### Step 1: Import Hook
```typescript
import { useRealtimeBookings } from '@/hooks/use-real-time'
```

### Step 2: Initialize Hook
```typescript
const { isConnected } = useRealtimeBookings(branchId, {
  onNew: (booking) => {
    setBookings(prev => [...prev, booking])
  },
  onUpdated: (booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? booking : b)
    )
  },
  onCancelled: (booking) => {
    setBookings(prev => prev.filter(b => b.id !== booking.id))
  }
})
```

### Step 3: Display Connection Status
```typescript
<div className={isConnected ? 'bg-green-100' : 'bg-red-100'}>
  {isConnected ? 'Live' : 'Offline'}
</div>
```

## Database Triggers for Real-Time

### Automatic Profile Creation

When a new user signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

This trigger:
1. Extracts role from user metadata
2. Creates profile record
3. Triggers real-time notification

### Listening to Changes

```sql
-- PostgreSQL automatically broadcasts changes
-- Supabase listens via websocket and notifies clients
LISTEN "realtime:public:bookings:branch_id=eq.123"
```

## Performance Optimization

### Filtering by Branch
```typescript
// Only subscribe to this branch's bookings
filter: `branch_id=eq.${branchId}`
```

### Handling Large Datasets
```typescript
// Initial fetch with pagination
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('branch_id', branchId)
  .range(0, 49) // First 50 records

// Real-time updates for changes
useRealtimeBookings(branchId, { /* callbacks */ })
```

### Unsubscribing When Unmounting
```typescript
useEffect(() => {
  const { unsubscribe } = useRealtimeBookings(branchId, { /* ... */ })
  
  return () => {
    unsubscribe() // Clean up on unmount
  }
}, [branchId])
```

## Debugging Real-Time Issues

### Enable Debug Logging

```typescript
// In component
const { isConnected } = useRealtime({
  table: 'bookings',
  onInsert: (data) => {
    console.log('[v0] Real-time INSERT:', data)
  },
  onUpdate: (data) => {
    console.log('[v0] Real-time UPDATE:', data)
  },
})

console.log('[v0] Real-time connection status:', isConnected)
```

### Check Connection Status

```typescript
// Browser DevTools
// Look for WebSocket connections to supabase
// Should see "postgres_changes" channel
```

### Verify RLS Policies

```typescript
// If updates not appearing, check RLS policies
// For branch manager to see bookings:
SELECT * FROM bookings WHERE branch_id = $1

// Ensure branch_id filter matches user's permission
```

## Real-Time Limitations & Solutions

### Issue: Updates Not Showing
**Solution**: 
- Verify RLS policies allow user to see data
- Check branch_id matches
- Ensure subscription filter is correct

### Issue: Many Slow Updates
**Solution**:
- Debounce rapid updates
- Batch related updates
- Unsubscribe from unused channels

### Issue: Memory Leaks
**Solution**:
- Unsubscribe in useEffect cleanup
- Remove old listeners
- Limit stored data

## Testing Real-Time Features

### Test 1: Multi-Device Sync
1. Open two browser windows
2. Add booking in window 1
3. Window 2 updates instantly
4. Verify calendar syncs

### Test 2: Double-Booking Prevention
1. Two users try to book same hall/time
2. First succeeds
3. Second sees warning
4. Both see conflict in real-time

### Test 3: Offline & Reconnect
1. Close DevTools network (simulate offline)
2. Try to add booking (should fail gracefully)
3. Reconnect network
4. Pending changes sync automatically

## Advanced Real-Time Patterns

### Pattern 1: Optimistic Updates
```typescript
// Update UI immediately
setBookings(prev => [...prev, newBooking])

// Save to database
const { error } = await createBooking(newBooking)

// Revert on error
if (error) {
  setBookings(prev => prev.filter(b => b.id !== newBooking.id))
}
```

### Pattern 2: Conflict Resolution
```typescript
// When real-time update conflicts with local change
onUpdate: (updated) => {
  setBookings(prev => {
    const local = prev.find(b => b.id === updated.id)
    
    if (local?.modified_at > updated.modified_at) {
      // Local change is newer, keep it
      return prev
    }
    
    // Remote change is newer, use it
    return prev.map(b => b.id === updated.id ? updated : b)
  })
}
```

### Pattern 3: Batch Operations
```typescript
// Batch multiple changes
const updates = [
  { ...booking1, status: 'confirmed' },
  { ...booking2, status: 'confirmed' },
]

await supabase.from('bookings').upsert(updates)
// Single real-time notification for all changes
```

## Production Checklist

- [ ] All real-time subscriptions unsubscribe on cleanup
- [ ] RLS policies verified for all roles
- [ ] Error handling for offline scenarios
- [ ] Loading states during sync
- [ ] Connection status visible to users
- [ ] Tested on mobile networks
- [ ] Performance tested with 1000+ records
- [ ] Conflict resolution logic tested
- [ ] Memory leaks checked
- [ ] Refresh token handling verified

## Monitoring Real-Time Health

```typescript
// Log real-time connection events
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('[v0] App hidden, subscriptions paused')
    } else {
      console.log('[v0] App visible, subscriptions resumed')
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [PostgreSQL LISTEN/NOTIFY](https://www.postgresql.org/docs/current/sql-listen.html)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
