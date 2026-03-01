# Deployment Checklist - Banquet Management System v2.0

## Pre-Deployment Verification

### Environment Setup
- [ ] Supabase project is created and configured
- [ ] `SUPABASE_URL` environment variable is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured (for server operations)
- [ ] `GOOGLE_GENAI_API_KEY` is set (for AI features)
- [ ] Next.js environment configured for production

### Database Setup
- [ ] Run migration script: `scripts/001_create_schema.sql`
- [ ] Verify `profiles` table exists
- [ ] Verify `bookings` table exists
- [ ] Verify `branches` table exists
- [ ] Verify `leads` table exists
- [ ] All RLS policies are active
- [ ] Realtime is enabled on required tables
- [ ] Auto-profile creation trigger is active

### Authentication
- [ ] Email verification is enabled in Supabase
- [ ] Auth JWT secret is configured
- [ ] Session timeout is set to reasonable value
- [ ] Password reset flow is tested

## Feature Testing

### 1. Role-Based Registration
- [ ] Sign up as "Owner" role
  - [ ] Account created successfully
  - [ ] Email verification sent
  - [ ] Can log in with role
  - [ ] Dashboard shows owner features
  
- [ ] Sign up as "Branch Manager" role
  - [ ] Account created successfully
  - [ ] Email verification sent
  - [ ] Can log in with role
  - [ ] Redirects to branch manager dashboard
  - [ ] Calendar page accessible
  
- [ ] Sign up as "Sales" role
  - [ ] Account created successfully
  - [ ] Email verification sent
  - [ ] Can log in with role
  - [ ] Dashboard shows sales features

### 2. Real-Time Booking Calendar
- [ ] Calendar loads correctly
- [ ] Can navigate between months
- [ ] Can view bookings for specific date
- [ ] Color coding works (Green/Amber/Red)
- [ ] "Add Booking" modal opens
- [ ] Can fill booking form
- [ ] Form validation works

### 3. Double-Booking Prevention
- [ ] Add first booking to Main Hall, March 15, 6:00 PM
  - [ ] Booking created successfully
  - [ ] Calendar updated with new booking
  
- [ ] Try to add second booking to same hall/time
  - [ ] Warning message appears
  - [ ] Booking submission blocked
  - [ ] Warning clearly states conflict
  
- [ ] Add different time slot
  - [ ] Booking created successfully
  - [ ] Calendar shows both bookings

### 4. Real-Time Synchronization
- [ ] Open calendar in two browser tabs (same role)
- [ ] Add booking in Tab 1
  - [ ] Tab 1 updates immediately
  - [ ] Tab 2 updates within 2 seconds
  - [ ] No page refresh required
  
- [ ] Update booking in Tab 1
  - [ ] Tab 2 reflects change instantly
  
- [ ] Delete/cancel booking in Tab 1
  - [ ] Tab 2 removes booking instantly

### 5. Role-Based Access Control
- [ ] Owner can access:
  - [ ] Dashboard
  - [ ] Leads
  - [ ] Bookings
  - [ ] Invoices
  - [ ] Inventory
  - [ ] Branches
  - [ ] Branch Priority
  - [ ] Supplies
  - [ ] Event Analysis
  - [ ] Features Guide
  - [ ] Settings

- [ ] Branch Manager can access:
  - [ ] Branch Manager dashboard
  - [ ] Booking calendar
  - [ ] Cannot access other pages (403/redirect)

- [ ] Sales can access:
  - [ ] Dashboard
  - [ ] Leads
  - [ ] Cannot access manager pages (403/redirect)

## Security Testing

### Authentication Security
- [ ] Password validation (min 8 characters)
- [ ] Confirm password matching
- [ ] Email format validation
- [ ] SQL injection prevention
- [ ] CSRF protection active
- [ ] XSS protection active

### Authorization Security
- [ ] RLS policies enforced
- [ ] Users cannot access other users' data
- [ ] Role-based restrictions working
- [ ] Unauthorized page access redirects to login
- [ ] Session expiry handling works

### Data Security
- [ ] Passwords hashed (verify in Supabase)
- [ ] No sensitive data in URLs
- [ ] API keys not exposed in frontend
- [ ] Real-time subscriptions filtered by user permission

## Performance Testing

### Load Testing
- [ ] Calendar loads with 100 bookings
- [ ] Calendar loads with 1000 bookings
- [ ] Responsive time < 2 seconds
- [ ] Real-time updates within 1 second

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing
- [ ] Sign-up form responsive on mobile
- [ ] Calendar readable on mobile
- [ ] Touch interactions work
- [ ] Landscape orientation supported

### Network Testing
- [ ] Works on 4G connection
- [ ] Works with network latency (test throttling)
- [ ] Handles temporary disconnections
- [ ] Reconnects automatically

## Error Handling

### Network Errors
- [ ] Graceful error message if Supabase down
- [ ] Graceful error message if network down
- [ ] Auto-retry for failed submissions
- [ ] Clear user guidance on what to do

### Validation Errors
- [ ] Invalid email shows error
- [ ] Weak password shows error
- [ ] Missing required fields shows error
- [ ] Double booking shows warning

### Edge Cases
- [ ] Add booking with special characters in name
- [ ] Add booking at midnight (00:00)
- [ ] Add booking on leap year date
- [ ] Very large guest count (999)

## Documentation Verification

- [ ] FINAL_IMPLEMENTATION.md is complete
- [ ] ROLE_BASED_SYSTEM.md covers all workflows
- [ ] REAL_TIME_GUIDE.md has examples
- [ ] QUICK_START.md works end-to-end
- [ ] Code comments are clear
- [ ] README is up-to-date

## Monitoring Setup

- [ ] Error tracking enabled (Sentry/similar)
- [ ] Analytics tracking configured
- [ ] Real-time monitoring dashboard set up
- [ ] Alert thresholds configured
- [ ] Logging configuration active
- [ ] Performance monitoring enabled

## Deployment Steps

### 1. Code Deployment
```bash
# Build for production
npm run build

# Run tests (if available)
npm run test

# Deploy to Vercel/hosting
npm run deploy
```

### 2. Database Deployment
```bash
# Run migrations in production Supabase
psql -h $SUPABASE_HOST -U postgres -d postgres -f scripts/001_create_schema.sql
```

### 3. Environment Configuration
```
Set in Vercel/hosting environment:
- SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_GENAI_API_KEY
```

### 4. Post-Deployment Testing
- [ ] Sign up works on production
- [ ] Login works on production
- [ ] Calendar works on production
- [ ] Real-time sync works on production
- [ ] Email verification works
- [ ] All features accessible

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Monitor database performance
- [ ] Monitor real-time connection stability
- [ ] Check email delivery

### First Week
- [ ] Review analytics
- [ ] Check for performance issues
- [ ] Monitor sign-up success rate
- [ ] Check for security issues
- [ ] User feedback review

### Ongoing
- [ ] Weekly error log review
- [ ] Monthly performance review
- [ ] Real-time connection stability check
- [ ] User activity monitoring

## Rollback Plan

### If Critical Issue Found
1. [ ] Identify issue and severity
2. [ ] Stop pushing changes
3. [ ] Revert to last known good commit
4. [ ] Test rollback
5. [ ] Deploy rollback
6. [ ] Notify users if needed
7. [ ] Fix issue in development
8. [ ] Redeploy after fix verified

### Database Rollback
```sql
-- Backup current data before any schema changes
-- Keep previous schema version available
-- Test restoration procedure before deployment
```

## Sign-Off

- [ ] Developer: Code review complete
- [ ] QA: All tests passed
- [ ] Security: Security review passed
- [ ] Manager: Approval to deploy
- [ ] Deployment: Production deployment successful

## Notes

### Additional Considerations

1. **Email Service**:
   - Verify email verification is working
   - Check Supabase email settings
   - Test with multiple email providers

2. **Database Backups**:
   - Set up automated backups
   - Test restore procedure
   - Document backup schedule

3. **Monitoring**:
   - Set up error tracking
   - Configure performance monitoring
   - Set up alerts for critical issues

4. **Support**:
   - Create support documentation
   - Set up support email/channel
   - Prepare FAQ document

## Sign-Off Log

| Date | Person | Role | Status | Notes |
|------|--------|------|--------|-------|
| | | | | |
| | | | | |
| | | | | |

## Version Information

- **Application Version**: 2.0
- **Database Schema Version**: 1
- **Deployment Date**: ___________
- **Deployed To**: ___________
- **Deployment By**: ___________

---

## Contacts

**Technical Support**: [contact info]
**Product Manager**: [contact info]
**Database Admin**: [contact info]
**Security Officer**: [contact info]

---

**Status**: Ready for Deployment ✅
**Last Updated**: [date]
**Next Review**: [date]
