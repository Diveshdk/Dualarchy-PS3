import { SupabaseClient } from '@supabase/supabase-js'

// Type definitions
export interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
  created_at: string
}

export interface Lead {
  id: string
  branch_id: string
  client_name: string
  client_email: string
  client_phone: string
  event_date: string
  event_type: string
  guest_count: number
  advance_amount: number
  status: 'new' | 'qualified' | 'advance_paid' | 'converted' | 'lost'
  source: string
  notes: string
  created_at: string
}

export interface Booking {
  id: string
  branch_id: string
  client_name: string
  client_email: string
  client_phone: string
  event_date: string
  event_time: string
  event_type: string
  hall_type: string
  guest_count: number
  total_amount: number
  advance_amount: number
  booking_status: 'confirmed' | 'tentative' | 'cancelled'
  notes: string
  created_at: string
}

export interface Invoice {
  id: string
  branch_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  subtotal: number
  gst_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  payment_status: 'pending' | 'partial' | 'paid'
  created_at: string
}

export interface InventoryItem {
  id: string
  branch_id: string
  item_name: string
  unit: string
  quantity_available: number
  min_threshold: number
  unit_cost: number
  created_at: string
}

// Database query utilities
export class DatabaseService {
  constructor(private supabase: SupabaseClient) {}

  // Leads
  async getLeads(branchId: string) {
    return await this.supabase
      .from('leads')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
  }

  async getLead(leadId: string) {
    return await this.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()
  }

  async createLead(branchId: string, lead: Omit<Lead, 'id' | 'created_at'>) {
    return await this.supabase
      .from('leads')
      .insert({ ...lead, branch_id: branchId })
      .select()
  }

  async updateLead(leadId: string, updates: Partial<Lead>) {
    return await this.supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
  }

  // Bookings
  async getBookings(branchId: string) {
    return await this.supabase
      .from('bookings')
      .select('*')
      .eq('branch_id', branchId)
      .order('event_date', { ascending: true })
  }

  async getBooking(bookingId: string) {
    return await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
  }

  async createBooking(branchId: string, booking: Omit<Booking, 'id' | 'created_at'>) {
    return await this.supabase
      .from('bookings')
      .insert({ ...booking, branch_id: branchId })
      .select()
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>) {
    return await this.supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
  }

  // Invoices
  async getInvoices(branchId: string) {
    return await this.supabase
      .from('invoices')
      .select('*')
      .eq('branch_id', branchId)
      .order('invoice_date', { ascending: false })
  }

  async getInvoice(invoiceId: string) {
    return await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()
  }

  async createInvoice(branchId: string, invoice: Omit<Invoice, 'id' | 'created_at'>) {
    return await this.supabase
      .from('invoices')
      .insert({ ...invoice, branch_id: branchId })
      .select()
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>) {
    return await this.supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
  }

  // Inventory
  async getInventory(branchId: string) {
    return await this.supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
      .order('item_name', { ascending: true })
  }

  async getInventoryItem(itemId: string) {
    return await this.supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .single()
  }

  async updateInventory(itemId: string, updates: Partial<InventoryItem>) {
    return await this.supabase
      .from('inventory')
      .update(updates)
      .eq('id', itemId)
      .select()
  }

  async getLowStockItems(branchId: string) {
    return await this.supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
      .lt('quantity_available', 'min_threshold')
  }

  // Analytics
  async getConversionStats(branchId: string) {
    const { count: totalLeads } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)

    const { count: convertedLeads } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)
      .eq('status', 'converted')

    return {
      totalLeads: totalLeads || 0,
      convertedLeads: convertedLeads || 0,
      conversionRate: totalLeads ? Math.round((convertedLeads || 0) / totalLeads * 100) : 0,
    }
  }

  async getRevenueStats(branchId: string) {
    const { data } = await this.supabase
      .from('bookings')
      .select('total_amount, created_at')
      .eq('branch_id', branchId)
      .eq('booking_status', 'confirmed')

    const totalRevenue = data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
    const bookingCount = data?.length || 0

    return {
      totalRevenue,
      bookingCount,
      averageBookingValue: bookingCount ? totalRevenue / bookingCount : 0,
    }
  }
}
