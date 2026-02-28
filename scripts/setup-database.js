import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const schema = `
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('owner', 'branch_manager', 'sales')) DEFAULT 'sales',
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_date DATE,
  guest_count INTEGER,
  advance_amount DECIMAL(10, 2) DEFAULT 0,
  advance_paid BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('lead', 'qualified', 'converted', 'lost')) DEFAULT 'lead',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  hall_type TEXT,
  guest_count INTEGER NOT NULL,
  advance_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2),
  booking_status TEXT CHECK (booking_status IN ('confirmed', 'tentative', 'cancelled')) DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  menu_details JSONB,
  vendors JSONB,
  checklist JSONB,
  finalized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity_available INTEGER NOT NULL,
  unit TEXT,
  reorder_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE,
  subtotal DECIMAL(10, 2),
  gst_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'paid')) DEFAULT 'pending',
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS branches_owner_id_idx ON public.branches(owner_id);
CREATE INDEX IF NOT EXISTS leads_branch_id_idx ON public.leads(branch_id);
CREATE INDEX IF NOT EXISTS leads_created_by_idx ON public.leads(created_by);
CREATE INDEX IF NOT EXISTS bookings_branch_id_idx ON public.bookings(branch_id);
CREATE INDEX IF NOT EXISTS bookings_event_date_idx ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS events_booking_id_idx ON public.events(booking_id);
CREATE INDEX IF NOT EXISTS inventory_branch_id_idx ON public.inventory(branch_id);
CREATE INDEX IF NOT EXISTS invoices_booking_id_idx ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON public.invoices(payment_status);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for branches
CREATE POLICY "Owners can view their branches"
  ON public.branches FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'owner'
  ));

CREATE POLICY "Branch managers can view assigned branches"
  ON public.branches FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'branch_manager'
  ));

-- RLS Policies for leads
CREATE POLICY "Users can view leads from their branches"
  ON public.leads FOR SELECT
  USING (branch_id IN (
    SELECT id FROM public.branches WHERE owner_id = auth.uid()
  ) OR created_by = auth.uid());

CREATE POLICY "Users can create leads in their branches"
  ON public.leads FOR INSERT
  WITH CHECK (branch_id IN (
    SELECT id FROM public.branches WHERE owner_id = auth.uid()
  ) AND created_by = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Users can view bookings from their branches"
  ON public.bookings FOR SELECT
  USING (branch_id IN (
    SELECT id FROM public.branches WHERE owner_id = auth.uid()
  ) OR created_by = auth.uid());

CREATE POLICY "Users can create bookings in their branches"
  ON public.bookings FOR INSERT
  WITH CHECK (branch_id IN (
    SELECT id FROM public.branches WHERE owner_id = auth.uid()
  ) AND created_by = auth.uid());

-- RLS Policies for events
CREATE POLICY "Users can view events for their bookings"
  ON public.events FOR SELECT
  USING (booking_id IN (
    SELECT id FROM public.bookings WHERE 
    branch_id IN (SELECT id FROM public.branches WHERE owner_id = auth.uid())
  ));

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory from their branches"
  ON public.inventory FOR SELECT
  USING (branch_id IN (
    SELECT id FROM public.branches WHERE owner_id = auth.uid()
  ));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices from their branches"
  ON public.invoices FOR SELECT
  USING (branch_id IN (
    SELECT id FROM public.branches WHERE owner_id = auth.uid()
  ));

-- Create trigger for auto-creating user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS \$\$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'sales')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`;

async function setupDatabase() {
  try {
    console.log('[v0] Starting database setup...');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`[v0] Executing: ${statement.substring(0, 80)}...`);
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).catch(() => {
        // If exec_sql doesn't exist, try direct query execution via admin API
        return supabase.rest().exec(statement);
      });

      if (error) {
        console.warn(`[v0] Warning: ${error.message}`);
        // Don't exit on error, some operations might already exist
      } else {
        console.log(`[v0] ✓ Executed successfully`);
      }
    }

    console.log('[v0] Database setup completed!');
  } catch (error) {
    console.error('[v0] Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
