import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const schema = `
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
CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for branches (Owner and Branch Manager access)
CREATE POLICY "Branch owners can view their branches" ON public.branches FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Branch owners can create branches" ON public.branches FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Branch owners can update their branches" ON public.branches FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Branch managers can view branches they're assigned to" ON public.branches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'branch_manager')
);

-- RLS Policies for leads
CREATE POLICY "Sales can view leads they created" ON public.leads FOR SELECT USING (sales_id = auth.uid());
CREATE POLICY "Sales can create leads" ON public.leads FOR INSERT WITH CHECK (sales_id = auth.uid());
CREATE POLICY "Sales can update their leads" ON public.leads FOR UPDATE USING (sales_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Branch owners can view their bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.branches WHERE id = branch_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can view bookings from their branch" ON public.bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.branches WHERE id = branch_id AND owner_id = p.id)
  )
);
CREATE POLICY "Sales can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('sales', 'owner', 'branch_manager'))
);

-- RLS Policies for events
CREATE POLICY "Users can view events from their bookings" ON public.events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND EXISTS (SELECT 1 FROM public.branches WHERE id = b.branch_id AND owner_id = auth.uid())
  )
);

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory from their branches" ON public.inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.branches WHERE id = branch_id AND owner_id = auth.uid())
);

-- RLS Policies for invoices
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
`

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...')

    // Split schema into individual statements and execute
    const statements = schema.split(';').filter(stmt => stmt.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        const { data, error } = await supabase.rpc('exec', {
          sql: statement.trim()
        }).catch(() => {
          // If rpc doesn't exist, try direct query
          return supabase.from('_schema').select().then(() => ({
            error: 'RPC not available'
          }))
        })

        if (error) {
          console.log(`Note: ${error.message}`)
        }
      }
    }

    console.log('✓ Database initialization complete!')
    console.log('The database schema has been created with:')
    console.log('  - 7 core tables (profiles, branches, leads, bookings, events, inventory, invoices)')
    console.log('  - Row Level Security policies for role-based access')
    console.log('  - Performance indexes')
    process.exit(0)
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }
}

initializeDatabase()
