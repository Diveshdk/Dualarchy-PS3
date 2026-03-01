// Demo Data Injection Script for EventEase Production Upgrade
// Run this after setting up the production schema

import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Demo data
const branches = [
  { name: 'Mumbai Central Banquet', city: 'Mumbai', address: '123 MG Road, Mumbai Central', capacity: 500, phone: '+91 98765 43210', priority: 1 },
  { name: 'Andheri East Grand Hall', city: 'Mumbai', address: '456 Andheri East, Mumbai', capacity: 300, phone: '+91 98765 43211', priority: 2 },
  { name: 'Thane West Convention', city: 'Thane', address: '789 Thane West, Thane', capacity: 400, phone: '+91 98765 43212', priority: 3 }
]

const vendors = [
  { type: 'catering', name: 'Elite Catering Services', contact: 'Ramesh Kumar', phone: '+91 98765 11111', rating: 4.5 },
  { type: 'decoration', name: 'Dream Decorators', contact: 'Priya Sharma', phone: '+91 98765 22222', rating: 4.8 },
  { type: 'photography', name: 'Perfect Moments Studio', contact: 'Rajesh Gupta', phone: '+91 98765 33333', rating: 4.7 },
  { type: 'entertainment', name: 'Star Entertainment', contact: 'Vikram Singh', phone: '+91 98765 44444', rating: 4.3 },
  { type: 'transport', name: 'Royal Transport Services', contact: 'Suresh Patil', phone: '+91 98765 55555', rating: 4.6 }
]

const supplies = [
  { category: 'appetizers', name: 'Paneer Tikka', unit: 'kg', threshold: 10 },
  { category: 'main_course', name: 'Basmati Rice', unit: 'kg', threshold: 20 },
  { category: 'main_course', name: 'Dal Makhani', unit: 'liters', threshold: 15 },
  { category: 'desserts', name: 'Gulab Jamun', unit: 'pcs', threshold: 50 },
  { category: 'beverages', name: 'Mineral Water', unit: 'bottles', threshold: 100 },
  { category: 'snacks', name: 'Samosa', unit: 'pcs', threshold: 30 }
]

const leadCompanies = [
  'TechCorp India', 'Sharma Industries', 'Patel Enterprises', 'Kumar & Associates',
  'Rajesh Traders', 'Singh Brothers', 'Mehta Group', 'Gupta Solutions',
  'Verma Technologies', 'Shah Ventures', 'Desai Holdings', 'Joshi Pvt Ltd',
  'Chopra Exports', 'Malhotra Systems', 'Kapoor Industries', 'Bhatia Corp',
  'Agarwal Traders', 'Bansal Group', 'Khanna Solutions', 'Reddy Enterprises',
  'Nair Technologies', 'Pillai Group', 'Menon Corp', 'Krishna Ventures',
  'Gopal Industries', 'Raman Traders', 'Lakshmi Enterprises', 'Saraswati Corp',
  'Durga Holdings', 'Ganesh Solutions'
]

const statuses = ['new', 'contacted', 'qualified', 'won', 'lost']

async function injectDemoData() {
  console.log('🚀 Starting demo data injection...\n')

  try {
    // Get owner user (you'll need to replace this with actual owner ID)
    console.log('📋 Step 1: Get owner user...')
    const { data: users } = await supabase.auth.admin.listUsers()
    const owner = users?.users[0]
    
    if (!owner) {
      console.error('❌ No users found. Please create a user first.')
      return
    }
    
    console.log(`✅ Found owner: ${owner.email}\n`)

    // Create branches
    console.log('🏢 Step 2: Creating branches...')
    const createdBranches = []
    
    for (const branch of branches) {
      const { data, error } = await supabase
        .from('branches')
        .insert([{
          ...branch,
          owner_id: owner.id,
          payment_completed: true
        }])
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating branch ${branch.name}:`, error.message)
      } else {
        createdBranches.push(data)
        console.log(`✅ Created: ${branch.name}`)

        // Create payment record
        await supabase
          .from('branch_payments')
          .insert([{
            owner_id: owner.id,
            branch_id: data.id,
            amount: 5000,
            payment_method: 'card',
            payment_status: 'success',
            transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
          }])

        // Create priority
        await supabase
          .from('branch_priority')
          .insert([{
            owner_id: owner.id,
            branch_id: data.id,
            priority_order: branch.priority
          }])
      }
    }

    console.log(`\n✅ Created ${createdBranches.length} branches\n`)

    // Create managers and sales for each branch
    console.log('👥 Step 3: Creating managers and sales executives...')
    
    for (const branch of createdBranches) {
      // Create manager email
      const managerEmail = `manager${branch.name.toLowerCase().replace(/\s+/g, '')}@eventease.com`
      
      // Create manager profile (simulated)
      console.log(`  📧 Manager for ${branch.name}: ${managerEmail}`)

      // Create 2 sales executives for each branch
      for (let i = 1; i <= 2; i++) {
        const salesEmail = `sales${i}${branch.name.toLowerCase().replace(/\s+/g, '')}@eventease.com`
        console.log(`  📧 Sales ${i} for ${branch.name}: ${salesEmail}`)
      }

      // Add vendors to branch
      console.log(`  🏪 Adding vendors to ${branch.name}...`)
      for (const vendor of vendors) {
        await supabase
          .from('vendors')
          .insert([{
            branch_id: branch.id,
            vendor_name: vendor.name,
            vendor_type: vendor.type,
            contact_person: vendor.contact,
            phone: vendor.phone,
            rating: vendor.rating,
            created_by: owner.id
          }])
      }

      // Add supplies to branch
      console.log(`  📦 Adding supplies to ${branch.name}...`)
      for (const supply of supplies) {
        const quantity = Math.random() > 0.3 ? 
          Math.floor(Math.random() * 50) + supply.threshold + 10 : // Healthy stock
          Math.floor(Math.random() * supply.threshold) // Low stock

        await supabase
          .from('food_supplies')
          .insert([{
            branch_id: branch.id,
            item_name: supply.name,
            category: supply.category,
            quantity,
            unit: supply.unit,
            threshold: supply.threshold,
            supplier_name: vendors[Math.floor(Math.random() * vendors.length)].name,
            created_by: owner.id
          }])
      }

      // Create 30 leads for each branch
      console.log(`  📝 Creating 30 leads for ${branch.name}...`)
      for (let i = 0; i < 30; i++) {
        const company = leadCompanies[i]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const budget = Math.floor(Math.random() * 500000) + 100000

        const { data: lead } = await supabase
          .from('leads')
          .insert([{
            branch_id: branch.id,
            sales_id: owner.id, // In real scenario, this would be sales exec ID
            company_name: company,
            contact_name: `Contact ${i + 1}`,
            email: `contact${i + 1}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            status,
            estimated_budget: budget
          }])
          .select()
          .single()

        // Update checklist randomly
        if (lead) {
          const progress = Math.random()
          await supabase
            .from('lead_checklist')
            .update({
              call_completed: progress > 0.1,
              call_date: progress > 0.1 ? new Date().toISOString() : null,
              property_visit_completed: progress > 0.3,
              property_visit_date: progress > 0.3 ? new Date().toISOString() : null,
              food_tasting_completed: progress > 0.5,
              food_tasting_date: progress > 0.5 ? new Date().toISOString() : null,
              advance_payment_completed: progress > 0.7 && status === 'won',
              advance_payment_date: progress > 0.7 && status === 'won' ? new Date().toISOString() : null,
              advance_amount: progress > 0.7 && status === 'won' ? budget * 0.3 : null
            })
            .eq('lead_id', lead.id)
        }
      }

      // Create 15 bookings for each branch
      console.log(`  📅 Creating 15 bookings for ${branch.name}...`)
      for (let i = 0; i < 15; i++) {
        const daysAhead = Math.floor(Math.random() * 90) + 1
        const eventDate = new Date()
        eventDate.setDate(eventDate.getDate() + daysAhead)

        await supabase
          .from('bookings')
          .insert([{
            branch_id: branch.id,
            client_name: `Client ${i + 1}`,
            event_type: ['wedding', 'corporate', 'birthday', 'anniversary'][Math.floor(Math.random() * 4)],
            event_date: eventDate.toISOString().split('T')[0],
            event_time: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
            hall_name: `Hall ${String.fromCharCode(65 + (i % 3))}`,
            guest_count: Math.floor(Math.random() * 300) + 100,
            total_cost: Math.floor(Math.random() * 300000) + 100000,
            status: 'confirmed'
          }])
      }
    }

    console.log('\n✅ All done!\n')
    console.log('📊 Summary:')
    console.log(`  - ${createdBranches.length} branches created`)
    console.log(`  - ${createdBranches.length * vendors.length} vendors added`)
    console.log(`  - ${createdBranches.length * supplies.length} supply items added`)
    console.log(`  - ${createdBranches.length * 30} leads created`)
    console.log(`  - ${createdBranches.length * 15} bookings created`)
    console.log('\n🎉 Demo data injection complete!')

  } catch (error) {
    console.error('❌ Error during demo data injection:', error)
  }
}

// Run the script
injectDemoData()
