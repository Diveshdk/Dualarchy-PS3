'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  Branch,
  Booking,
  Lead,
  Event,
  Invoice,
  InventoryItem,
  ApiResponse,
  CreateLeadForm,
  CreateBookingForm,
  CreateBranchForm,
} from '@/lib/types';

// ============= BRANCH ACTIONS =============

export async function createBranch(form: CreateBranchForm): Promise<ApiResponse<Branch>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    const { data, error } = await supabase
      .from('branches')
      .insert([
        {
          owner_id: userData.user.id,
          name: form.name,
          location: form.location,
          phone: form.phone,
          email: form.email,
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getBranches(): Promise<ApiResponse<Branch[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('owner_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= LEAD ACTIONS =============

export async function createLead(form: CreateLeadForm): Promise<ApiResponse<Lead>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          branch_id: form.branch_id,
          created_by: userData.user.id,
          client_name: form.client_name,
          client_email: form.client_email,
          client_phone: form.client_phone,
          event_date: form.event_date,
          guest_count: form.guest_count,
          advance_amount: form.advance_amount || 0,
          status: 'lead',
          notes: form.notes,
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getLeads(branchId: string): Promise<ApiResponse<Lead[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: 'lead' | 'qualified' | 'converted' | 'lost'
): Promise<ApiResponse<Lead>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function convertLeadToBooking(leadId: string): Promise<ApiResponse<Booking>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { data: null, error: 'Lead not found', success: false };
    }

    // Create booking from lead
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          branch_id: lead.branch_id,
          lead_id: leadId,
          created_by: userData.user.id,
          client_name: lead.client_name,
          client_email: lead.client_email,
          client_phone: lead.client_phone,
          event_date: lead.event_date,
          guest_count: lead.guest_count,
          advance_amount: lead.advance_amount,
          booking_status: 'confirmed',
        },
      ])
      .select()
      .single();

    if (bookingError) {
      return { data: null, error: bookingError.message, success: false };
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', leadId);

    return { data: booking, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= BOOKING ACTIONS =============

export async function createBooking(form: CreateBookingForm): Promise<ApiResponse<Booking>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    // Check for booking conflicts (same branch, hall, date)
    if (form.hall_type) {
      const { data: conflicting } = await supabase
        .from('bookings')
        .select('id')
        .eq('branch_id', form.branch_id)
        .eq('hall_type', form.hall_type)
        .eq('event_date', form.event_date)
        .eq('booking_status', 'confirmed');

      if (conflicting && conflicting.length > 0) {
        return {
          data: null,
          error: 'This hall is already booked for this date',
          success: false,
        };
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          branch_id: form.branch_id,
          lead_id: form.lead_id,
          created_by: userData.user.id,
          client_name: form.client_name,
          client_email: form.client_email,
          client_phone: form.client_phone,
          event_date: form.event_date,
          event_time: form.event_time,
          hall_type: form.hall_type,
          guest_count: form.guest_count,
          advance_amount: form.advance_amount || 0,
          total_amount: form.total_amount,
          booking_status: 'confirmed',
          notes: form.notes,
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getBookings(branchId: string): Promise<ApiResponse<Booking[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('branch_id', branchId)
      .order('event_date', { ascending: true });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= INVOICE ACTIONS =============

export async function createInvoice(
  bookingId: string,
  branchId: string,
  subtotal: number
): Promise<ApiResponse<Invoice>> {
  try {
    const supabase = await createClient();

    const gstAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + gstAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          booking_id: bookingId,
          branch_id: branchId,
          invoice_number: invoiceNumber,
          subtotal,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getInvoices(branchId: string): Promise<ApiResponse<Invoice[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('branch_id', branchId)
      .order('invoice_date', { ascending: false });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= INVENTORY ACTIONS =============

export async function getInventory(branchId: string): Promise<ApiResponse<InventoryItem[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
      .order('item_name', { ascending: true });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getLowStockItems(branchId: string): Promise<ApiResponse<InventoryItem[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId)
      .filter('quantity_available', 'lte', supabase.rpc('coalesce(reorder_level, 10)'))
      .order('quantity_available', { ascending: true });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}
