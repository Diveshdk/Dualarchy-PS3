-- =====================================================
-- PRODUCTION-GRADE SCHEMA UPGRADE
-- Banquet Management SaaS v2.0
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BRANCH PAYMENTS TABLE (₹5000 per branch)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branch_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
  payment_method TEXT CHECK (payment_method IN ('card', 'upi', 'netbanking')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  transaction_id TEXT UNIQUE,
  payment_gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. BRANCH MANAGERS TABLE (One manager per branch)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branch_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE UNIQUE, -- One manager per branch
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_manager_per_branch UNIQUE(branch_id)
);

-- =====================================================
-- 3. SALES EXECUTIVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales_executives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_sales_per_branch UNIQUE(branch_id, sales_id)
);

-- =====================================================
-- 4. VENDORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL CHECK (vendor_type IN ('catering', 'decoration', 'photography', 'entertainment', 'transport', 'other')),
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. FOOD SUPPLIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.food_supplies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('appetizers', 'main_course', 'desserts', 'beverages', 'snacks')),
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  threshold DECIMAL(10, 2) NOT NULL, -- Alert when quantity <= threshold
  cost_per_unit DECIMAL(10, 2),
  supplier_name TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. LEAD LIFECYCLE CHECKLIST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  call_completed BOOLEAN DEFAULT FALSE,
  call_date TIMESTAMP WITH TIME ZONE,
  property_visit_completed BOOLEAN DEFAULT FALSE,
  property_visit_date TIMESTAMP WITH TIME ZONE,
  food_tasting_completed BOOLEAN DEFAULT FALSE,
  food_tasting_date TIMESTAMP WITH TIME ZONE,
  advance_payment_completed BOOLEAN DEFAULT FALSE,
  advance_payment_date TIMESTAMP WITH TIME ZONE,
  advance_amount DECIMAL(10, 2),
  menu_finalized BOOLEAN DEFAULT FALSE,
  menu_finalized_date TIMESTAMP WITH TIME ZONE,
  decoration_finalized BOOLEAN DEFAULT FALSE,
  decoration_finalized_date TIMESTAMP WITH TIME ZONE,
  full_payment_completed BOOLEAN DEFAULT FALSE,
  full_payment_date TIMESTAMP WITH TIME ZONE,
  full_payment_amount DECIMAL(10, 2),
  post_event_settlement BOOLEAN DEFAULT FALSE,
  post_event_settlement_date TIMESTAMP WITH TIME ZONE,
  feedback_collected BOOLEAN DEFAULT FALSE,
  feedback_date TIMESTAMP WITH TIME ZONE,
  feedback_text TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'branch_purchase', 
    'manager_assignment', 
    'sales_assignment', 
    'lead_created',
    'lead_converted', 
    'booking_created',
    'inventory_updated', 
    'payment_event',
    'vendor_added',
    'supply_added'
  )),
  entity_type TEXT CHECK (entity_type IN ('branch', 'lead', 'booking', 'inventory', 'payment', 'vendor', 'supply')),
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'high_priority')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 9. BRANCH PRIORITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branch_priority (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  priority_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_branch_priority UNIQUE(owner_id, branch_id),
  CONSTRAINT unique_priority_order UNIQUE(owner_id, priority_order)
);

-- =====================================================
-- 10. ALTER EXISTING TABLES
-- =====================================================

-- Add branch_id to profiles for branch managers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add payment_required flag to branches
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS payment_completed BOOLEAN DEFAULT FALSE;

-- Update leads table with estimated_budget field
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimated_budget DECIMAL(10, 2);

-- Add double booking prevention fields to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_hash TEXT;

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_branch_payments_owner ON public.branch_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_branch_payments_status ON public.branch_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_branch_managers_branch ON public.branch_managers(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_managers_manager ON public.branch_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_sales_executives_branch ON public.sales_executives(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_executives_sales ON public.sales_executives(sales_id);
CREATE INDEX IF NOT EXISTS idx_vendors_branch ON public.vendors(branch_id);
CREATE INDEX IF NOT EXISTS idx_food_supplies_branch ON public.food_supplies(branch_id);
CREATE INDEX IF NOT EXISTS idx_food_supplies_threshold ON public.food_supplies(quantity, threshold);
CREATE INDEX IF NOT EXISTS idx_lead_checklist_lead ON public.lead_checklist(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_branch_priority_owner ON public.branch_priority(owner_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_bookings_hash ON public.bookings(booking_hash);

-- =====================================================
-- 12. RLS POLICIES
-- =====================================================

-- Branch Payments
ALTER TABLE public.branch_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their payments" ON public.branch_payments;
CREATE POLICY "Owners can view their payments" 
  ON public.branch_payments FOR SELECT 
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert payments" ON public.branch_payments;
CREATE POLICY "Owners can insert payments" 
  ON public.branch_payments FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- Branch Managers
ALTER TABLE public.branch_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and managers can view assignments" ON public.branch_managers;
CREATE POLICY "Owners and managers can view assignments" 
  ON public.branch_managers FOR SELECT 
  USING (auth.uid() = assigned_by OR auth.uid() = manager_id);

DROP POLICY IF EXISTS "Owners can assign managers" ON public.branch_managers;
CREATE POLICY "Owners can assign managers" 
  ON public.branch_managers FOR INSERT 
  WITH CHECK (auth.uid() = assigned_by);

-- Sales Executives
ALTER TABLE public.sales_executives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Branch managers and sales can view" ON public.sales_executives;
CREATE POLICY "Branch managers and sales can view" 
  ON public.sales_executives FOR SELECT 
  USING (auth.uid() = assigned_by OR auth.uid() = sales_id);

DROP POLICY IF EXISTS "Branch managers can assign sales" ON public.sales_executives;
CREATE POLICY "Branch managers can assign sales" 
  ON public.sales_executives FOR INSERT 
  WITH CHECK (auth.uid() = assigned_by);

-- Vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Branch team can view vendors" ON public.vendors;
CREATE POLICY "Branch team can view vendors" 
  ON public.vendors FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.branches b 
      WHERE b.id = branch_id 
      AND (b.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.branch_managers bm 
        WHERE bm.branch_id = b.id AND bm.manager_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Branch managers can add vendors" ON public.vendors;
CREATE POLICY "Branch managers can add vendors" 
  ON public.vendors FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Food Supplies
ALTER TABLE public.food_supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Branch team can view supplies" ON public.food_supplies;
CREATE POLICY "Branch team can view supplies" 
  ON public.food_supplies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.branches b 
      WHERE b.id = branch_id 
      AND (b.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.branch_managers bm 
        WHERE bm.branch_id = b.id AND bm.manager_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Branch managers can add supplies" ON public.food_supplies;
CREATE POLICY "Branch managers can add supplies" 
  ON public.food_supplies FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Branch managers can update supplies" ON public.food_supplies;
CREATE POLICY "Branch managers can update supplies" 
  ON public.food_supplies FOR UPDATE 
  USING (auth.uid() = created_by);

-- Lead Checklist
ALTER TABLE public.lead_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales can view their lead checklist" ON public.lead_checklist;
CREATE POLICY "Sales can view their lead checklist" 
  ON public.lead_checklist FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = lead_id AND l.sales_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sales can update checklist" ON public.lead_checklist;
CREATE POLICY "Sales can update checklist" 
  ON public.lead_checklist FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = lead_id AND l.sales_id = auth.uid()
    )
  );

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their activity" ON public.activity_logs;
CREATE POLICY "Users can view their activity" 
  ON public.activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert activity" ON public.activity_logs;
CREATE POLICY "Users can insert activity" 
  ON public.activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Branch Priority
ALTER TABLE public.branch_priority ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage priority" ON public.branch_priority;
CREATE POLICY "Owners can manage priority" 
  ON public.branch_priority FOR ALL 
  USING (auth.uid() = owner_id);

-- =====================================================
-- 13. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create lead checklist automatically
CREATE OR REPLACE FUNCTION create_lead_checklist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lead_checklist (lead_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_lead_checklist ON public.leads;
CREATE TRIGGER trigger_create_lead_checklist
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_checklist();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    user_id, action_type, entity_type, entity_id, description, metadata
  ) VALUES (
    p_user_id, p_action_type, p_entity_type, p_entity_id, p_description, p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, priority, action_url, metadata
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority, p_action_url, p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check double booking
CREATE OR REPLACE FUNCTION check_double_booking(
  p_branch_id UUID,
  p_event_date DATE,
  p_hall_name TEXT,
  p_event_time TIME,
  p_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE branch_id = p_branch_id
    AND event_date = p_event_date
    AND hall_name = p_hall_name
    AND event_time = p_event_time
    AND status = 'confirmed'
    AND (p_booking_id IS NULL OR id != p_booking_id)
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recommended branch
CREATE OR REPLACE FUNCTION get_recommended_branch(
  p_owner_id UUID,
  p_requested_branch_id UUID,
  p_event_date DATE,
  p_hall_name TEXT,
  p_event_time TIME
)
RETURNS TABLE (
  branch_id UUID,
  branch_name TEXT,
  priority_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.branch_id,
    b.name as branch_name,
    bp.priority_order
  FROM public.branch_priority bp
  JOIN public.branches b ON b.id = bp.branch_id
  WHERE bp.owner_id = p_owner_id
  AND bp.branch_id != p_requested_branch_id
  AND NOT check_double_booking(bp.branch_id, p_event_date, p_hall_name, p_event_time)
  ORDER BY bp.priority_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update inventory color status
CREATE OR REPLACE FUNCTION get_inventory_health(p_branch_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_low_stock_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_low_stock_count
  FROM public.food_supplies
  WHERE branch_id = p_branch_id
  AND quantity <= threshold;
  
  IF v_low_stock_count > 0 THEN
    RETURN 'red';
  ELSE
    RETURN 'green';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETE
-- =====================================================
