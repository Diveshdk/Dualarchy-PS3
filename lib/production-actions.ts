'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// BRANCH PURCHASE & PAYMENT
// =====================================================

export async function purchaseBranch(paymentData: {
  amount: number
  payment_method: string
  transaction_id: string
  branchData: {
    name: string
    address?: string
    city?: string
    phone?: string
    capacity?: number
  }
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Start transaction - Insert payment first
    const { data: payment, error: paymentError } = await supabase
      .from('branch_payments')
      .insert({
        owner_id: user.id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id,
        payment_status: 'success',
        payment_gateway_response: { demo: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Create branch after successful payment
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        owner_id: user.id,
        name: paymentData.branchData.name,
        address: paymentData.branchData.address,
        city: paymentData.branchData.city,
        phone: paymentData.branchData.phone,
        capacity: paymentData.branchData.capacity || 500,
        payment_completed: true
      })
      .select()
      .single()

    if (branchError) throw branchError

    // Update payment with branch_id
    await supabase
      .from('branch_payments')
      .update({ branch_id: branch.id })
      .eq('id', payment.id)

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'branch_purchase',
      p_entity_type: 'branch',
      p_entity_id: branch.id,
      p_description: `Purchased branch: ${branch.name} for ₹${paymentData.amount}`,
      p_metadata: { transaction_id: paymentData.transaction_id, payment_method: paymentData.payment_method }
    })

    // Initialize branch priority
    const { data: existingPriorities } = await supabase
      .from('branch_priority')
      .select('priority_order')
      .eq('owner_id', user.id)
      .order('priority_order', { ascending: false })
      .limit(1)

    const nextPriority = existingPriorities && existingPriorities.length > 0 
      ? existingPriorities[0].priority_order + 1 
      : 1

    await supabase
      .from('branch_priority')
      .insert({
        owner_id: user.id,
        branch_id: branch.id,
        priority_order: nextPriority
      })

    revalidatePath('/dashboard/branches')
    return { success: true, branch }
  } catch (error) {
    console.error('Branch purchase error:', error)
    return { success: false, error: 'Failed to purchase branch' }
  }
}

// =====================================================
// ASSIGN BRANCH MANAGER
// =====================================================

export async function assignBranchManager(branchId: string, managerEmail: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if user owns the branch
    const { data: branch } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .eq('owner_id', user.id)
      .single()

    if (!branch) throw new Error('Branch not found or unauthorized')

    // Find user by email
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', managerEmail)
      .single()

    if (!managerProfile) throw new Error('User not found')

    // Check if branch already has a manager
    const { data: existingManager } = await supabase
      .from('branch_managers')
      .select('*')
      .eq('branch_id', branchId)
      .single()

    if (existingManager) throw new Error('Branch already has a manager')

    // Update user role to branch_manager
    await supabase
      .from('profiles')
      .update({ 
        role: 'branch_manager',
        branch_id: branchId
      })
      .eq('id', managerProfile.id)

    // Create branch manager assignment
    await supabase
      .from('branch_managers')
      .insert({
        branch_id: branchId,
        manager_id: managerProfile.id,
        assigned_by: user.id
      })

    // Send high-priority notification to manager
    await supabase.rpc('send_notification', {
      p_user_id: managerProfile.id,
      p_title: 'Branch Manager Assignment',
      p_message: `You have been assigned as the manager of ${branch.name}`,
      p_type: 'high_priority',
      p_priority: 'urgent',
      p_action_url: '/dashboard/branch-manager',
      p_metadata: { branch_id: branchId, branch_name: branch.name }
    })

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'manager_assignment',
      p_entity_type: 'branch',
      p_entity_id: branchId,
      p_description: `Assigned manager to ${branch.name}`,
      p_metadata: { manager_id: managerProfile.id, manager_email: managerEmail }
    })

    revalidatePath('/dashboard/branches')
    return { success: true }
  } catch (error: any) {
    console.error('Assign manager error:', error)
    return { success: false, error: error.message || 'Failed to assign manager' }
  }
}

// =====================================================
// SALES EXECUTIVE MANAGEMENT
// =====================================================

export async function addSalesExecutive(branchId: string, salesEmail: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if user is branch manager
    const { data: managerAssignment } = await supabase
      .from('branch_managers')
      .select('*')
      .eq('branch_id', branchId)
      .eq('manager_id', user.id)
      .single()

    if (!managerAssignment) throw new Error('Unauthorized - not branch manager')

    // Find or create user
    const { data: salesProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', salesEmail)
      .single()

    if (!salesProfile) throw new Error('User not found')

    // Update role to sales
    await supabase
      .from('profiles')
      .update({ 
        role: 'sales',
        branch_id: branchId
      })
      .eq('id', salesProfile.id)

    // Add to sales executives
    await supabase
      .from('sales_executives')
      .insert({
        branch_id: branchId,
        sales_id: salesProfile.id,
        assigned_by: user.id,
        email: salesEmail
      })

    // Send notification
    await supabase.rpc('send_notification', {
      p_user_id: salesProfile.id,
      p_title: 'Sales Executive Assignment',
      p_message: 'You have been added as a Sales Executive',
      p_type: 'info',
      p_priority: 'normal',
      p_action_url: '/dashboard/leads'
    })

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'sales_assignment',
      p_entity_type: 'branch',
      p_entity_id: branchId,
      p_description: `Added sales executive: ${salesEmail}`
    })

    revalidatePath('/dashboard/branch-manager')
    return { success: true }
  } catch (error: any) {
    console.error('Add sales error:', error)
    return { success: false, error: error.message || 'Failed to add sales executive' }
  }
}

// =====================================================
// VENDOR MANAGEMENT
// =====================================================

export async function addVendor(branchId: string, vendorData: {
  vendor_name: string
  vendor_type: string
  contact_person?: string
  phone: string
  email?: string
  address?: string
  rating?: number
  notes?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        ...vendorData,
        branch_id: branchId,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'vendor_added',
      p_entity_type: 'vendor',
      p_entity_id: vendor.id,
      p_description: `Added vendor: ${vendorData.vendor_name}`
    })

    revalidatePath('/dashboard/vendors')
    return { success: true, vendor }
  } catch (error) {
    console.error('Add vendor error:', error)
    return { success: false, error: 'Failed to add vendor' }
  }
}

// =====================================================
// FOOD SUPPLIES MANAGEMENT
// =====================================================

export async function addFoodSupply(branchId: string, supplyData: {
  item_name: string
  category: string
  quantity: number
  unit: string
  threshold: number
  cost_per_unit?: number
  supplier_name?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: supply, error } = await supabase
      .from('food_supplies')
      .insert({
        ...supplyData,
        branch_id: branchId,
        created_by: user.id,
        last_restocked: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'supply_added',
      p_entity_type: 'supply',
      p_entity_id: supply.id,
      p_description: `Added supply: ${supplyData.item_name}`
    })

    revalidatePath('/dashboard/supplies')
    return { success: true, supply }
  } catch (error) {
    console.error('Add supply error:', error)
    return { success: false, error: 'Failed to add supply' }
  }
}

export async function updateFoodSupply(supplyId: string, quantity: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('food_supplies')
      .update({ 
        quantity,
        last_restocked: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', supplyId)

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'inventory_updated',
      p_entity_type: 'supply',
      p_entity_id: supplyId,
      p_description: `Updated supply quantity to ${quantity}`
    })

    revalidatePath('/dashboard/supplies')
    return { success: true }
  } catch (error) {
    console.error('Update supply error:', error)
    return { success: false, error: 'Failed to update supply' }
  }
}

// =====================================================
// LEAD & CHECKLIST MANAGEMENT
// =====================================================

export async function createLeadWithChecklist(branchId: string, leadData: {
  name: string
  email?: string
  phone?: string
  event_date?: string
  guest_count?: number
  estimated_budget?: number
  notes?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        branch_id: branchId,
        sales_id: user.id,
        ...leadData,
        status: 'new'
      })
      .select()
      .single()

    if (leadError) throw leadError

    // Checklist is auto-created by trigger

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action_type: 'lead_created',
      p_entity_type: 'lead',
      p_entity_id: lead.id,
      p_description: `Created lead: ${leadData.name}`
    })

    revalidatePath('/dashboard/leads')
    return { success: true, lead }
  } catch (error) {
    console.error('Create lead error:', error)
    return { success: false, error: 'Failed to create lead' }
  }
}

export async function updateLeadChecklist(leadId: string, checklistData: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('lead_checklist')
      .update({
        ...checklistData,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)

    if (error) throw error

    // If advance payment completed, create booking
    if (checklistData.advance_payment_completed && checklistData.advance_amount > 0) {
      await convertLeadToBooking(leadId, checklistData.advance_amount)
    }

    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error) {
    console.error('Update checklist error:', error)
    return { success: false, error: 'Failed to update checklist' }
  }
}

async function convertLeadToBooking(leadId: string, advanceAmount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  // Get lead details
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) return

  // Check for double booking
  if (lead.event_date) {
    const isDoubleBooked = await supabase.rpc('check_double_booking', {
      p_branch_id: lead.branch_id,
      p_event_date: lead.event_date,
      p_hall_name: 'Main Hall', // Default hall
      p_event_time: '18:00:00'
    })

    if (isDoubleBooked) {
      // Get recommended branch
      const { data: recommended } = await supabase.rpc('get_recommended_branch', {
        p_owner_id: user.id,
        p_requested_branch_id: lead.branch_id,
        p_event_date: lead.event_date,
        p_hall_name: 'Main Hall',
        p_event_time: '18:00:00'
      })

      if (recommended && recommended.length > 0) {
        // Notify about recommended branch
        await supabase.rpc('send_notification', {
          p_user_id: user.id,
          p_title: 'Branch Recommended',
          p_message: `Selected branch is fully booked. Recommended: ${recommended[0].branch_name}`,
          p_type: 'warning',
          p_priority: 'high'
        })
      }
      return
    }
  }

  // Create booking
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      branch_id: lead.branch_id,
      lead_id: leadId,
      client_name: lead.name,
      email: lead.email,
      phone: lead.phone,
      event_date: lead.event_date,
      event_time: '18:00:00',
      hall_name: 'Main Hall',
      guest_count: lead.guest_count || 0,
      advance_paid: advanceAmount,
      total_cost: lead.estimated_budget || 0,
      status: 'confirmed'
    })
    .select()
    .single()

  if (!booking) return

  // Update lead status
  await supabase
    .from('leads')
    .update({ status: 'won' })
    .eq('id', leadId)

  // Send notification to branch manager
  const { data: managerData } = await supabase
    .from('branch_managers')
    .select('manager_id')
    .eq('branch_id', lead.branch_id)
    .single()

  if (managerData) {
    await supabase.rpc('send_notification', {
      p_user_id: managerData.manager_id,
      p_title: 'New Booking Created',
      p_message: `New booking created: ${lead.name}`,
      p_type: 'success',
      p_priority: 'high',
      p_action_url: '/dashboard/bookings'
    })
  }

  // Log activity
  await supabase.rpc('log_activity', {
    p_user_id: user.id,
    p_action_type: 'lead_converted',
    p_entity_type: 'booking',
    p_entity_id: booking.id,
    p_description: `Converted lead to booking: ${lead.name}`,
    p_metadata: { lead_id: leadId, advance_amount: advanceAmount }
  })

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard/leads')
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

export async function getNotifications() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return { success: true, notifications }
  } catch (error) {
    return { success: false, error: 'Failed to get notifications' }
  }
}
