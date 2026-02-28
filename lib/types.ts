// User & Authentication Types
export type UserRole = 'owner' | 'branch_manager' | 'sales';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  email: string;
  phone: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

// Branch Types
export interface Branch {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// Lead Types
export type LeadStatus = 'new' | 'contacted' | 'visit' | 'tasting' | 'negotiation' | 'advance_paid' | 'lost';

export interface Lead {
  id: string;
  branch_id: string;
  assigned_sales_id: string | null;
  name: string;
  phone: string;
  event_date: string;
  guest_count: number;
  estimated_budget: number | null;
  status: LeadStatus;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Booking Types
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  lead_id: string | null;
  branch_id: string;
  hall_name: string;
  event_date: string;
  guest_count: number;
  advance_amount: number;
  total_amount: number;
  balance_amount: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// Event Types
export interface MenuItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Vendor {
  type: string;
  name: string;
  phone: string;
  email?: string;
  cost: number;
}

export interface ChecklistItem {
  task: string;
  completed: boolean;
  assigned_to?: string;
  due_date?: string;
}

export interface Event {
  id: string;
  booking_id: string;
  guest_count: number;
  menu_items: MenuItem[] | null;
  vendors: Vendor[] | null;
  checklist: ChecklistItem[] | null;
  notes: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  branch_id: string;
  item_name: string;
  quantity: number;
  threshold: number;
  unit: string | null;
  updated_at: string;
}

// Invoice Types
export type PaymentStatus = 'paid' | 'pending';

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string | null;
  subtotal: number;
  gst: number;
  total: number;
  advance_paid: number;
  balance_due: number;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

// Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
}

// Form Types
export interface CreateLeadForm {
  branch_id: string;
  assigned_sales_id?: string;
  name: string;
  phone: string;
  event_date: string;
  guest_count: number;
  estimated_budget?: number;
  follow_up_date?: string;
  notes?: string;
}

export interface CreateBookingForm {
  branch_id: string;
  lead_id?: string;
  hall_name: string;
  event_date: string;
  guest_count: number;
  advance_amount: number;
  total_amount: number;
}

export interface CreateBranchForm {
  name: string;
  location?: string;
  phone?: string;
  email?: string;
}

// Dashboard Statistics
export interface DashboardStats {
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number;
  pendingInvoices: number;
  upcomingEvents: number;
  lowStockItems: number;
  overdueFollowUps: number;
}

// Chart Data
export interface ChartData {
  name: string;
  value: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  gst: number;
}

export interface LeadFunnelData {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface BranchRevenueData {
  branch: string;
  revenue: number;
  bookings: number;
}

// Team member
export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  branch_id: string | null;
  branch_name?: string | null;
  phone: string | null;
}
