-- ============================================================================
-- Banquet Management SaaS - Database Schema & Row Level Security
-- ============================================================================

-- 1. PROFILES TABLE (User management with roles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text check (role in ('owner', 'branch_manager', 'sales')) default 'sales',
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. BRANCHES TABLE (Multi-branch architecture)
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  location text,
  phone text,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. LEADS TABLE (Sales pipeline)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  assigned_sales_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text not null,
  event_date date not null,
  guest_count integer not null check (guest_count > 0),
  estimated_budget numeric(10, 2),
  status text check (status in ('new', 'contacted', 'visit', 'tasting', 'negotiation', 'advance_paid', 'lost')) default 'new',
  follow_up_date date,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. BOOKINGS TABLE (Confirmed events)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  branch_id uuid not null references public.branches(id) on delete cascade,
  hall_name text not null,
  event_date date not null,
  advance_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null,
  balance_amount numeric(10, 2) generated always as (total_amount - advance_amount) stored,
  status text check (status in ('confirmed', 'completed', 'cancelled')) default 'confirmed',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. EVENTS TABLE (Event details with menus and vendors)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guest_count integer not null check (guest_count > 0),
  menu_items jsonb default '[]'::jsonb,
  vendors jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  notes text,
  finalized_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. INVENTORY TABLE (Stock management)
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  threshold integer not null default 10,
  unit text default 'pcs',
  updated_at timestamp with time zone default now()
);

-- 7. INVOICES TABLE (Billing and payments)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  invoice_number text unique,
  subtotal numeric(10, 2) not null,
  gst numeric(10, 2) generated always as (subtotal * 0.18) stored,
  total numeric(10, 2) generated always as (subtotal + (subtotal * 0.18)) stored,
  advance_paid numeric(10, 2) not null default 0,
  balance_due numeric(10, 2) generated always as ((subtotal + (subtotal * 0.18)) - advance_paid) stored,
  status text check (status in ('paid', 'pending')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

create index idx_profiles_branch_id on public.profiles(branch_id);
create index idx_profiles_role on public.profiles(role);
create index idx_leads_branch_id on public.leads(branch_id);
create index idx_leads_assigned_sales_id on public.leads(assigned_sales_id);
create index idx_leads_status on public.leads(status);
create index idx_leads_event_date on public.leads(event_date);
create index idx_bookings_branch_id on public.bookings(branch_id);
create index idx_bookings_lead_id on public.bookings(lead_id);
create index idx_bookings_event_date on public.bookings(event_date);
create index idx_bookings_status on public.bookings(status);
create index idx_events_booking_id on public.events(booking_id);
create index idx_inventory_branch_id on public.inventory(branch_id);
create index idx_invoices_booking_id on public.invoices(booking_id);
create index idx_invoices_status on public.invoices(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.events enable row level security;
alter table public.inventory enable row level security;
alter table public.invoices enable row level security;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
create policy "profiles_select_own" on public.profiles for select
  using (auth.uid() = id);

-- Owners can view all profiles
create policy "profiles_select_owner" on public.profiles for select
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Owners can insert profiles
create policy "profiles_insert_owner" on public.profiles for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Owners can delete profiles
create policy "profiles_delete_owner" on public.profiles for delete
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- ============================================================================
-- BRANCHES POLICIES
-- ============================================================================

-- Owners can see all branches
create policy "branches_select_owner" on public.branches for select
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Branch managers and sales can see their branch
create policy "branches_select_assigned" on public.branches for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and branch_id = branches.id
    )
  );

-- Only owners can insert/update/delete branches
create policy "branches_insert_owner" on public.branches for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "branches_update_owner" on public.branches for update
  using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "branches_delete_owner" on public.branches for delete
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- ============================================================================
-- LEADS POLICIES
-- ============================================================================

-- Owners can see all leads
create policy "leads_select_owner" on public.leads for select
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Branch managers can see all leads in their branch
create policy "leads_select_branch_manager" on public.leads for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- Sales can see only their assigned leads
create policy "leads_select_sales" on public.leads for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'sales'
    and assigned_sales_id = auth.uid()
  );

-- Owners can insert leads
create policy "leads_insert_owner" on public.leads for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Branch managers can insert leads in their branch
create policy "leads_insert_branch_manager" on public.leads for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- Owners and branch managers can update leads
create policy "leads_update_owner" on public.leads for update
  using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "leads_update_branch_manager" on public.leads for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- Sales can update only their own leads
create policy "leads_update_sales" on public.leads for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'sales'
    and assigned_sales_id = auth.uid()
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'sales'
    and assigned_sales_id = auth.uid()
  );

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

-- Owners can see all bookings
create policy "bookings_select_owner" on public.bookings for select
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Branch managers can see bookings in their branch
create policy "bookings_select_branch_manager" on public.bookings for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- Sales can see bookings linked to their leads
create policy "bookings_select_sales" on public.bookings for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'sales'
    and exists (
      select 1 from public.leads
      where id = bookings.lead_id and assigned_sales_id = auth.uid()
    )
  );

-- Owners and branch managers can insert bookings
create policy "bookings_insert_owner" on public.bookings for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "bookings_insert_branch_manager" on public.bookings for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- Update policies
create policy "bookings_update_owner" on public.bookings for update
  using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "bookings_update_branch_manager" on public.bookings for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Owners can see all events
create policy "events_select_owner" on public.events for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'owner'
  );

-- Branch managers can see events in their branch
create policy "events_select_branch_manager" on public.events for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and exists (
      select 1 from public.bookings
      where id = events.booking_id
      and branch_id = (select branch_id from public.profiles where id = auth.uid())
    )
  );

-- Update policies
create policy "events_update_owner" on public.events for update
  using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "events_update_branch_manager" on public.events for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and exists (
      select 1 from public.bookings
      where id = events.booking_id
      and branch_id = (select branch_id from public.profiles where id = auth.uid())
    )
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and exists (
      select 1 from public.bookings
      where id = events.booking_id
      and branch_id = (select branch_id from public.profiles where id = auth.uid())
    )
  );

-- ============================================================================
-- INVENTORY POLICIES
-- ============================================================================

-- Owners can see all inventory
create policy "inventory_select_owner" on public.inventory for select
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Branch managers can see inventory for their branch
create policy "inventory_select_branch_manager" on public.inventory for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- Update/Insert policies
create policy "inventory_update_owner" on public.inventory for update
  using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "inventory_update_branch_manager" on public.inventory for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

create policy "inventory_insert_owner" on public.inventory for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "inventory_insert_branch_manager" on public.inventory for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- ============================================================================
-- INVOICES POLICIES
-- ============================================================================

-- Owners can see all invoices
create policy "invoices_select_owner" on public.invoices for select
  using ((select role from public.profiles where id = auth.uid()) = 'owner');

-- Branch managers can see invoices for bookings in their branch
create policy "invoices_select_branch_manager" on public.invoices for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and exists (
      select 1 from public.bookings
      where id = invoices.booking_id
      and branch_id = (select branch_id from public.profiles where id = auth.uid())
    )
  );

-- Update policies
create policy "invoices_update_owner" on public.invoices for update
  using ((select role from public.profiles where id = auth.uid()) = 'owner')
  with check ((select role from public.profiles where id = auth.uid()) = 'owner');

create policy "invoices_update_branch_manager" on public.invoices for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and exists (
      select 1 from public.bookings
      where id = invoices.booking_id
      and branch_id = (select branch_id from public.profiles where id = auth.uid())
    )
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'branch_manager'
    and exists (
      select 1 from public.bookings
      where id = invoices.booking_id
      and branch_id = (select branch_id from public.profiles where id = auth.uid())
    )
  );

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'sales')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Auto-generate invoice number
create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
declare
  invoice_num text;
begin
  invoice_num := 'INV-' || to_char(now(), 'YYYYMM') || '-' || lpad(
    (select count(*) + 1 from public.invoices where created_at >= date_trunc('month', now()))::text,
    5,
    '0'
  );
  return invoice_num;
end;
$$;

-- Trigger to auto-assign invoice number
create or replace function public.set_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := public.generate_invoice_number();
  end if;
  return new;
end;
$$;

drop trigger if exists set_invoice_number_trigger on public.invoices;

create trigger set_invoice_number_trigger
  before insert on public.invoices
  for each row
  execute function public.set_invoice_number();
