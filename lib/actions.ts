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
  Profile,
  DashboardStats,
  RevenueData,
  LeadFunnelData,
  BranchRevenueData,
  TeamMember,
} from '@/lib/types';

// ============= PROFILE ACTIONS =============

export async function getCurrentUserProfile(): Promise<ApiResponse<Profile>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      return { data: null, error: 'Unauthorized', success: false };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
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

export async function updateProfile(updates: { full_name?: string; phone?: string }): Promise<ApiResponse<Profile>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userData.user.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= TEAM ACTIONS (Owner only) =============

export async function getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    // Get branches owned by this user
    const { data: ownerBranches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('owner_id', userData.user.id);

    const branchIds = ownerBranches?.map((b) => b.id) || [];
    const branchMap = Object.fromEntries((ownerBranches || []).map((b) => [b.id, b.name]));

    // Get profiles assigned to those branches
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .in('branch_id', branchIds);

    if (error) return { data: null, error: error.message, success: false };

    const members: TeamMember[] = (profiles || []).map((p) => ({
      ...p,
      branch_name: p.branch_id ? branchMap[p.branch_id] ?? null : null,
    }));

    return { data: members, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function assignUserToBranch(
  userId: string,
  branchId: string | null
): Promise<ApiResponse<Profile>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ branch_id: branchId })
      .eq('id', userId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= BRANCH ACTIONS =============

export async function createBranch(form: CreateBranchForm): Promise<ApiResponse<Branch>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    const { data, error } = await supabase
      .from('branches')
      .insert([{ owner_id: userData.user.id, ...form }])
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateBranch(
  branchId: string,
  form: Partial<CreateBranchForm>
): Promise<ApiResponse<Branch>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('branches')
      .update(form)
      .eq('id', branchId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
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
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, branch_id')
      .eq('id', userData.user.id)
      .single();

    let query = supabase.from('branches').select('*');

    if (profile?.role === 'owner') {
      query = query.eq('owner_id', userData.user.id);
    } else if (profile?.role === 'branch_manager' || profile?.role === 'sales') {
      if (profile.branch_id) {
        query = query.eq('id', profile.branch_id);
      } else {
        return { data: [], error: null, success: true };
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message, success: false };
    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= DASHBOARD STATS =============

export async function getDashboardStats(branchId: string): Promise<ApiResponse<DashboardStats>> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalLeads },
      { count: totalBookings },
      { data: paidInvoices },
      { count: pendingInvoiceCount },
      { count: upcomingEvents },
      { count: lowStockItems },
      { count: overdueFollowUps },
    ] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('status', 'confirmed'),
      supabase.from('invoices').select('total').eq('status', 'paid'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('status', 'confirmed').gte('event_date', today),
      supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).filter('quantity', 'lte', 'threshold'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).lt('follow_up_date', today).not('follow_up_date', 'is', null).not('status', 'eq', 'advance_paid').not('status', 'eq', 'lost'),
    ]);

    const totalRevenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    return {
      data: {
        totalLeads: totalLeads || 0,
        totalBookings: totalBookings || 0,
        totalRevenue,
        pendingInvoices: pendingInvoiceCount || 0,
        upcomingEvents: upcomingEvents || 0,
        lowStockItems: lowStockItems || 0,
        overdueFollowUps: overdueFollowUps || 0,
      },
      error: null,
      success: true,
    };
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
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        branch_id: form.branch_id,
        assigned_sales_id: form.assigned_sales_id || userData.user.id,
        name: form.name,
        phone: form.phone,
        event_date: form.event_date,
        guest_count: form.guest_count,
        estimated_budget: form.estimated_budget,
        status: 'new',
        follow_up_date: form.follow_up_date,
        notes: form.notes,
      }])
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
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
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    let query = supabase.from('leads').select('*').eq('branch_id', branchId);

    if (profile?.role === 'sales') {
      query = query.eq('assigned_sales_id', userData.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message, success: false };
    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: Lead['status']
): Promise<ApiResponse<Lead>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateLead(
  leadId: string,
  updates: Partial<CreateLeadForm>
): Promise<ApiResponse<Lead>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function convertLeadToBooking(
  leadId: string,
  hallName: string,
  advanceAmount: number,
  totalAmount: number
): Promise<ApiResponse<Booking>> {
  try {
    const supabase = await createClient();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) return { data: null, error: 'Lead not found', success: false };

    // Check for double booking
    const { data: conflicting } = await supabase
      .from('bookings')
      .select('id')
      .eq('branch_id', lead.branch_id)
      .eq('hall_name', hallName)
      .eq('event_date', lead.event_date)
      .eq('status', 'confirmed');

    if (conflicting && conflicting.length > 0) {
      return { data: null, error: `"${hallName}" is already booked on ${lead.event_date}. Please choose a different hall.`, success: false };
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        branch_id: lead.branch_id,
        lead_id: leadId,
        hall_name: hallName,
        event_date: lead.event_date,
        guest_count: lead.guest_count,
        advance_amount: advanceAmount,
        total_amount: totalAmount,
        status: 'confirmed',
      }])
      .select()
      .single();

    if (bookingError) return { data: null, error: bookingError.message, success: false };

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'advance_paid', updated_at: new Date().toISOString() })
      .eq('id', leadId);

    // Auto-create invoice
    await supabase.from('invoices').insert([{
      booking_id: booking.id,
      subtotal: totalAmount,
      advance_paid: advanceAmount,
      status: advanceAmount >= totalAmount * 1.18 ? 'paid' : 'pending',
    }]);

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

    // Check double booking
    const { data: conflicting } = await supabase
      .from('bookings')
      .select('id')
      .eq('branch_id', form.branch_id)
      .eq('hall_name', form.hall_name)
      .eq('event_date', form.event_date)
      .eq('status', 'confirmed');

    if (conflicting && conflicting.length > 0) {
      return { data: null, error: `"${form.hall_name}" is already booked on ${form.event_date}`, success: false };
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        branch_id: form.branch_id,
        lead_id: form.lead_id,
        hall_name: form.hall_name,
        event_date: form.event_date,
        guest_count: form.guest_count,
        advance_amount: form.advance_amount,
        total_amount: form.total_amount,
        status: 'confirmed',
      }])
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };

    // Auto-create invoice
    await supabase.from('invoices').insert([{
      booking_id: data.id,
      subtotal: form.total_amount,
      advance_paid: form.advance_amount,
      status: form.advance_amount >= form.total_amount * 1.18 ? 'paid' : 'pending',
    }]);

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

    if (error) return { data: null, error: error.message, success: false };
    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking['status']
): Promise<ApiResponse<Booking>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= INVOICE ACTIONS =============

export async function createInvoice(
  bookingId: string,
  subtotal: number,
  advancePaid: number = 0
): Promise<ApiResponse<Invoice>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        booking_id: bookingId,
        subtotal,
        advance_paid: advancePaid,
        status: advancePaid >= subtotal * 1.18 ? 'paid' : 'pending',
      }])
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
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
      .select(`*, bookings!inner(branch_id, hall_name, event_date, guest_count, leads(name, phone))`)
      .eq('bookings.branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message, success: false };
    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'paid' | 'pending',
  advancePaid?: number
): Promise<ApiResponse<Invoice>> {
  try {
    const supabase = await createClient();
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (advancePaid !== undefined) updates['advance_paid'] = advancePaid;

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
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

    if (error) return { data: null, error: error.message, success: false };
    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function createInventoryItem(
  branchId: string,
  item: { item_name: string; quantity: number; threshold: number; unit?: string }
): Promise<ApiResponse<InventoryItem>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory')
      .insert([{ branch_id: branchId, ...item }])
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateInventoryItem(
  itemId: string,
  updates: { item_name?: string; quantity?: number; threshold?: number; unit?: string }
): Promise<ApiResponse<InventoryItem>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function deleteInventoryItem(itemId: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    if (error) return { data: null, error: error.message, success: false };
    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= EVENTS ACTIONS =============

export async function getEvents(branchId: string): Promise<ApiResponse<Event[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select(`*, bookings!inner(branch_id, hall_name, event_date, guest_count, status, leads(name, phone))`)
      .eq('bookings.branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message, success: false };
    return { data: data || [], error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function createEvent(
  bookingId: string,
  eventData: Partial<Pick<Event, 'guest_count' | 'menu_items' | 'vendors' | 'checklist' | 'notes'>>
): Promise<ApiResponse<Event>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .insert([{ booking_id: bookingId, ...eventData }])
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Pick<Event, 'guest_count' | 'menu_items' | 'vendors' | 'checklist' | 'notes' | 'finalized_at'>>
): Promise<ApiResponse<Event>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, success: false };
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

// ============= ANALYTICS ACTIONS =============

export async function getRevenueData(branchId: string): Promise<ApiResponse<RevenueData[]>> {
  try {
    const supabase = await createClient();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`subtotal, gst, total, created_at, bookings!inner(branch_id)`)
      .eq('bookings.branch_id', branchId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .eq('status', 'paid');

    if (error) return { data: null, error: error.message, success: false };

    // Group by month
    const monthMap: Record<string, { revenue: number; gst: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[key] = { revenue: 0, gst: 0 };
    }

    (invoices || []).forEach((inv) => {
      const d = new Date(inv.created_at);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthMap[key]) {
        monthMap[key].revenue += inv.subtotal || 0;
        monthMap[key].gst += inv.gst || 0;
      }
    });

    const result: RevenueData[] = Object.entries(monthMap).map(([month, v]) => ({
      month,
      revenue: Math.round(v.revenue),
      gst: Math.round(v.gst),
    }));

    return { data: result, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getLeadFunnelData(branchId: string): Promise<ApiResponse<LeadFunnelData[]>> {
  try {
    const supabase = await createClient();
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status')
      .eq('branch_id', branchId);

    if (error) return { data: null, error: error.message, success: false };

    const statusConfig: LeadFunnelData[] = [
      { status: 'new', label: 'New', count: 0, color: '#6366f1' },
      { status: 'contacted', label: 'Contacted', count: 0, color: '#8b5cf6' },
      { status: 'visit', label: 'Site Visit', count: 0, color: '#a855f7' },
      { status: 'tasting', label: 'Tasting', count: 0, color: '#d946ef' },
      { status: 'negotiation', label: 'Negotiation', count: 0, color: '#ec4899' },
      { status: 'advance_paid', label: 'Converted', count: 0, color: '#22c55e' },
      { status: 'lost', label: 'Lost', count: 0, color: '#ef4444' },
    ];

    (leads || []).forEach((lead) => {
      const item = statusConfig.find((s) => s.status === lead.status);
      if (item) item.count++;
    });

    return { data: statusConfig, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getBranchRevenueComparison(): Promise<ApiResponse<BranchRevenueData[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return { data: null, error: 'Unauthorized', success: false };

    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, name')
      .eq('owner_id', userData.user.id);

    if (error) return { data: null, error: error.message, success: false };

    const results: BranchRevenueData[] = await Promise.all(
      (branches || []).map(async (branch) => {
        const { data: invoices } = await supabase
          .from('invoices')
          .select(`total, bookings!inner(branch_id)`)
          .eq('bookings.branch_id', branch.id)
          .eq('status', 'paid');

        const { count: bookings } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('branch_id', branch.id);

        return {
          branch: branch.name,
          revenue: (invoices || []).reduce((s, i) => s + (i.total || 0), 0),
          bookings: bookings || 0,
        };
      })
    );

    return { data: results, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}

export async function getBookingStatusData(branchId: string): Promise<ApiResponse<{ name: string; value: number; color: string }[]>> {
  try {
    const supabase = await createClient();
    const { data: bookings, error } = await supabase.from('bookings').select('status').eq('branch_id', branchId);
    if (error) return { data: null, error: error.message, success: false };

    const counts = { confirmed: 0, completed: 0, cancelled: 0 };
    (bookings || []).forEach((b) => { counts[b.status as keyof typeof counts]++; });

    return {
      data: [
        { name: 'Confirmed', value: counts.confirmed, color: '#6366f1' },
        { name: 'Completed', value: counts.completed, color: '#22c55e' },
        { name: 'Cancelled', value: counts.cancelled, color: '#ef4444' },
      ],
      error: null,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, success: false };
  }
}
