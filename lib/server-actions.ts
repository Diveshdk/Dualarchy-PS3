'use server'

import { createClient } from '@/lib/supabase/server'

// Branch Actions
export async function getBranches() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('branches')
      .select('id, name, address, city, phone')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching branches:', error)
    return null
  }
}

// Dashboard Stats
export async function getDashboardStats(branchId: string) {
  try {
    const supabase = await createClient()

    // Get total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)

    // Get converted leads
    const { count: convertedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)
      .eq('status', 'converted')

    // Get total bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('branch_id', branchId)

    // Get low stock items
    const { count: lowStockItems } = await supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)
      .lt('quantity_available', 'min_threshold')

    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
    const conversionRate = totalLeads ? Math.round((convertedLeads || 0) / totalLeads * 100) : 0

    return {
      totalLeads: totalLeads || 0,
      convertedLeads: convertedLeads || 0,
      conversionRate,
      totalBookings: bookings?.length || 0,
      totalRevenue,
      lowStockItems: lowStockItems || 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      totalBookings: 0,
      totalRevenue: 0,
      lowStockItems: 0,
    }
  }
}

// Leads Actions
export async function getLeads(branchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching leads:', error)
    return []
  }
}

export async function createLead(branchId: string, leadData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('leads')
      .insert({
        branch_id: branchId,
        ...leadData,
        created_at: new Date(),
      })
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating lead:', error)
    return null
  }
}

export async function updateLead(leadId: string, leadData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('leads')
      .update(leadData)
      .eq('id', leadId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating lead:', error)
    return null
  }
}

export async function convertLeadToBooking(leadId: string, bookingData: any) {
  try {
    const supabase = await createClient()

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'converted' })
      .eq('id', leadId)

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error converting lead to booking:', error)
    return null
  }
}

// Bookings Actions
export async function getBookings(branchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('branch_id', branchId)
      .order('event_date', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return []
  }
}

export async function createBooking(branchId: string, bookingData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        branch_id: branchId,
        ...bookingData,
        created_at: new Date(),
      })
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating booking:', error)
    return null
  }
}

export async function updateBooking(bookingId: string, bookingData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bookings')
      .update(bookingData)
      .eq('id', bookingId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating booking:', error)
    return null
  }
}

// Invoices Actions
export async function getInvoices(branchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('branch_id', branchId)
      .order('invoice_date', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
}

export async function createInvoice(branchId: string, invoiceData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        branch_id: branchId,
        ...invoiceData,
        created_at: new Date(),
      })
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating invoice:', error)
    return null
  }
}

// Inventory Actions
export async function getInventory(branchId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
      .order('item_name', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}

export async function updateInventory(inventoryId: string, inventoryData: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory')
      .update(inventoryData)
      .eq('id', inventoryId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating inventory:', error)
    return null
  }
}

// Auth Actions
export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}
