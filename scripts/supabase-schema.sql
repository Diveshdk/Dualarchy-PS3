-- ============================================================
-- Banquet Management SaaS - Complete Supabase Schema + RLS
-- MIGRATION-SAFE VERSION: Uses ADD COLUMN IF NOT EXISTS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS (safe create)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'branch_manager', 'sales');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'visit', 'tasting', 'negotiation', 'advance_paid', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('paid', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROFILES TABLE (may already exist — migrate safely)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'sales',
  branch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add role column if missing (enum type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'sales';
  END IF;
END $$;

-- ============================================================
-- BRANCHES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE branches ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add FK from profiles.branch_id → branches.id (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_branch_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- LEADS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  assigned_sales_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 0,
  estimated_budget NUMERIC(12, 2),
  status lead_status NOT NULL DEFAULT 'new',
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_sales_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_budget NUMERIC(12, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'status'
  ) THEN
    ALTER TABLE leads ADD COLUMN status lead_status NOT NULL DEFAULT 'new';
  END IF;
END $$;

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  hall_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 0,
  advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN status booking_status NOT NULL DEFAULT 'confirmed';
  END IF;
END $$;

-- Add balance_amount as generated column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'balance_amount'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN balance_amount NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - advance_amount) STORED;
  END IF;
END $$;

-- Double booking prevention index (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'bookings_no_double'
  ) THEN
    CREATE UNIQUE INDEX bookings_no_double
      ON bookings(branch_id, hall_name, event_date)
      WHERE status = 'confirmed';
  END IF;
END $$;

-- ============================================================
-- EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_count INTEGER NOT NULL DEFAULT 0,
  menu_items JSONB DEFAULT '[]',
  vendors JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS vendors JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================
-- INVENTORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 10,
  unit TEXT DEFAULT 'pcs',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS threshold INTEGER NOT NULL DEFAULT 10;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================
-- INVOICES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'status'
  ) THEN
    ALTER TABLE invoices ADD COLUMN status payment_status NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Add generated columns for invoices if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'gst'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN gst NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(subtotal * 0.18, 2)) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'total'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN total NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(subtotal * 1.18, 2)) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'balance_due'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN balance_due NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(subtotal * 1.18 - advance_paid, 2)) STORED;
  END IF;
END $$;

-- Unique index on invoice_number
CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_unique ON invoices(invoice_number)
  WHERE invoice_number IS NOT NULL;

-- ============================================================
-- AUTO-INCREMENT INVOICE NUMBER TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  yr TEXT;
  seq_num INTEGER;
BEGIN
  yr := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM invoices WHERE invoice_number LIKE 'INV-' || yr || '-%';
  NEW.invoice_number := 'INV-' || yr || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tname TEXT;
BEGIN
  FOREACH tname IN ARRAY ARRAY['profiles','branches','leads','bookings','events','inventory','invoices'] LOOP
    EXECUTE FORMAT('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', tname, tname);
  END LOOP;
END $$;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: PROFILES
-- ============================================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_user_role() = 'owner'
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR get_user_role() = 'owner'
  );

-- ============================================================
-- RLS: BRANCHES
-- ============================================================

DROP POLICY IF EXISTS "branches_select" ON branches;
DROP POLICY IF EXISTS "branches_insert" ON branches;
DROP POLICY IF EXISTS "branches_update" ON branches;
DROP POLICY IF EXISTS "branches_delete" ON branches;

CREATE POLICY "branches_select" ON branches
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id = get_user_branch_id()
  );

CREATE POLICY "branches_insert" ON branches
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND get_user_role() = 'owner'
  );

CREATE POLICY "branches_update" ON branches
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "branches_delete" ON branches
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- RLS: LEADS
-- ============================================================

DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (
    CASE get_user_role()
      WHEN 'owner' THEN
        branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN
        branch_id = get_user_branch_id()
      WHEN 'sales' THEN
        assigned_sales_id = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (
    CASE get_user_role()
      WHEN 'owner' THEN
        branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN
        branch_id = get_user_branch_id()
      WHEN 'sales' THEN
        branch_id = get_user_branch_id() AND assigned_sales_id = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (
    CASE get_user_role()
      WHEN 'owner' THEN
        branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN
        branch_id = get_user_branch_id()
      WHEN 'sales' THEN
        assigned_sales_id = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "leads_delete" ON leads
  FOR DELETE USING (
    get_user_role() IN ('owner', 'branch_manager')
    AND CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

-- ============================================================
-- RLS: BOOKINGS
-- ============================================================

DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "bookings_delete" ON bookings;

CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      WHEN 'sales' THEN branch_id = get_user_branch_id()
          AND lead_id IN (SELECT id FROM leads WHERE assigned_sales_id = auth.uid())
      ELSE false
    END
  );

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE USING (
    get_user_role() = 'owner'
    AND branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
  );

-- ============================================================
-- RLS: EVENTS
-- ============================================================

DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;

CREATE POLICY "events_select" ON events
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings)
  );

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings)
    AND get_user_role() IN ('owner', 'branch_manager')
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    booking_id IN (SELECT id FROM bookings)
    AND get_user_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- RLS: INVENTORY
-- ============================================================

DROP POLICY IF EXISTS "inventory_select" ON inventory;
DROP POLICY IF EXISTS "inventory_insert" ON inventory;
DROP POLICY IF EXISTS "inventory_update" ON inventory;
DROP POLICY IF EXISTS "inventory_delete" ON inventory;

CREATE POLICY "inventory_select" ON inventory
  FOR SELECT USING (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

CREATE POLICY "inventory_insert" ON inventory
  FOR INSERT WITH CHECK (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

CREATE POLICY "inventory_update" ON inventory
  FOR UPDATE USING (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

CREATE POLICY "inventory_delete" ON inventory
  FOR DELETE USING (
    CASE get_user_role()
      WHEN 'owner' THEN branch_id IN (SELECT id FROM branches WHERE owner_id = auth.uid())
      WHEN 'branch_manager' THEN branch_id = get_user_branch_id()
      ELSE false
    END
  );

-- ============================================================
-- RLS: INVOICES
-- ============================================================

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;

CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings)
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings)
    AND get_user_role() IN ('owner', 'branch_manager')
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    booking_id IN (SELECT id FROM bookings)
    AND get_user_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sales')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
