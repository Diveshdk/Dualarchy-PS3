// User & Authentication Types
export type UserRole = 'owner' | 'branch_manager' | 'sales';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  email: string;
  phone: string | null;
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
export type LeadStatus = 'lead' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: string;
  branch_id: string;
  created_by: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  event_date: string | null;
  guest_count: number | null;
  advance_amount: number;
  advance_paid: boolean;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Booking Types
export type BookingStatus = 'confirmed' | 'tentative' | 'cancelled';

export interface Booking {
  id: string;
  branch_id: string;
  lead_id: string | null;
  created_by: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  event_date: string;
  event_time: string | null;
  hall_type: string | null;
  guest_count: number;
  advance_amount: number;
  total_amount: number | null;
  booking_status: BookingStatus;
  notes: string | null;
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
  menu_details: MenuItem[] | null;
  vendors: Vendor[] | null;
  checklist: ChecklistItem[] | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  branch_id: string;
  item_name: string;
  quantity_available: number;
  unit: string | null;
  reorder_level: number | null;
  created_at: string;
  updated_at: string;
}

// Invoice Types
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface Invoice {
  id: string;
  booking_id: string;
  branch_id: string;
  invoice_number: string | null;
  subtotal: number | null;
  gst_amount: number | null;
  total_amount: number | null;
  paid_amount: number;
  payment_status: PaymentStatus;
  invoice_date: string;
  due_date: string | null;
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
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_date?: string;
  guest_count?: number;
  advance_amount?: number;
  notes?: string;
}

export interface CreateBookingForm {
  branch_id: string;
  lead_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_date: string;
  event_time?: string;
  hall_type?: string;
  guest_count: number;
  advance_amount?: number;
  total_amount?: number;
  notes?: string;
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
}

// Chart Data
export interface ChartData {
  name: string;
  value: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  gst: number;
}
