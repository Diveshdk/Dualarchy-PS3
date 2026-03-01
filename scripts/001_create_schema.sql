-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'branch_manager', 'sales')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  event_date DATE,
  guest_count INTEGER,
  budget DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'negotiating', 'won', 'lost')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  hall_name TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  advance_paid DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  menu TEXT,
  vendors TEXT,
  checklist TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'finalized', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT,
  reorder_level INTEGER,
  cost_per_unit DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  gst DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  issued_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for branches
DROP POLICY IF EXISTS "Branch owners can view their branches" ON public.branches;
CREATE POLICY "Branch owners can view their branches" ON public.branches FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Branch owners can create branches" ON public.branches;
CREATE POLICY "Branch owners can create branches" ON public.branches FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Branch owners can update their branches" ON public.branches;
CREATE POLICY "Branch owners can update their branches" ON public.branches FOR UPDATE USING (owner_id = auth.uid());

-- RLS Policies for leads
DROP POLICY IF EXISTS "Sales can view leads they created" ON public.leads;
CREATE POLICY "Sales can view leads they created" ON public.leads FOR SELECT USING (sales_id = auth.uid());

DROP POLICY IF EXISTS "Sales can create leads" ON public.leads;
CREATE POLICY "Sales can create leads" ON public.leads FOR INSERT WITH CHECK (sales_id = auth.uid());

DROP POLICY IF EXISTS "Sales can update their leads" ON public.leads;
CREATE POLICY "Sales can update their leads" ON public.leads FOR UPDATE USING (sales_id = auth.uid());

-- RLS Policies for bookings
DROP POLICY IF EXISTS "Branch owners can view their bookings" ON public.bookings;
CREATE POLICY "Branch owners can view their bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.branches WHERE id = branch_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Sales can create bookings" ON public.bookings;
CREATE POLICY "Sales can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.branches WHERE id = branch_id AND (
    SELECT owner_id FROM public.branches WHERE id = branch_id
  ) = auth.uid())
);

-- RLS Policies for events
DROP POLICY IF EXISTS "Users can view events from their bookings" ON public.events;
CREATE POLICY "Users can view events from their bookings" ON public.events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND EXISTS (SELECT 1 FROM public.branches WHERE id = b.branch_id AND owner_id = auth.uid())
  )
);

-- RLS Policies for inventory
DROP POLICY IF EXISTS "Users can view inventory from their branches" ON public.inventory;
CREATE POLICY "Users can view inventory from their branches" ON public.inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.branches WHERE id = branch_id AND owner_id = auth.uid())
);

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view invoices from their bookings" ON public.invoices;
CREATE POLICY "Users can view invoices from their bookings" ON public.invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND EXISTS (SELECT 1 FROM public.branches WHERE id = b.branch_id AND owner_id = auth.uid())
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_branches_owner ON public.branches(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_branch ON public.leads(branch_id);
CREATE INDEX IF NOT EXISTS idx_leads_sales ON public.leads(sales_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_bookings_branch ON public.bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_events_booking ON public.events(booking_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON public.inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);

-- Create trigger for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
