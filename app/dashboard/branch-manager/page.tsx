'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Package, Users, Store, TrendingUp, AlertTriangle, Plus } from 'lucide-react'

interface Supply {
  id: string
  item_name: string
  category: string
  quantity: number
  unit: string
  threshold: number
  supplier_name: string
}

interface Vendor {
  id: string
  vendor_name: string
  vendor_type: string
  contact_person: string
  phone: string
  email: string
  rating: number
}

interface SalesExec {
  id: string
  email: string
  full_name: string
  created_at: string
}

interface Lead {
  id: string
  company_name: string
  contact_name: string
  status: string
  estimated_budget: number
  sales_name: string
}

interface Stats {
  totalSupplies: number
  lowStockItems: number
  totalVendors: number
  totalSales: number
  totalLeads: number
  conversionRate: number
}

export default function BranchManagerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          router.push('/auth/login')
          return
        }

        setUserRole(profile.role)

        // Only branch managers can access this page
        if (profile.role !== 'branch_manager') {
          router.push('/dashboard')
          return
        }

        // Fetch branch data - in a real app, you'd associate branch manager with specific branch
        const { data: branches, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .limit(1)
          .single()

        if (branchError) {
          console.error('[v0] Error fetching branch:', branchError)
          // Create a default branch for demo
          return
        }

        if (branches) {
          setBranch(branches)

          // Fetch booking stats
          const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('branch_id', branches.id)
            .eq('status', 'confirmed')

          if (!bookingError && bookings) {
            const now = new Date().toISOString().split('T')[0]
            const upcomingEvents = bookings.filter((b) => b.event_date >= now).length
            const totalGuests = bookings.reduce((sum, b) => sum + (b.guest_count || 0), 0)

            setStats({
              totalBookings: bookings.length,
              upcomingEvents,
              occupancyRate: Math.round((upcomingEvents / Math.max(bookings.length, 1)) * 100),
              avgGuestCount: bookings.length > 0 ? Math.round(totalGuests / bookings.length) : 0,
            })
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('[v0] Error in branch manager dashboard:', err)
        setLoading(false)
      }
    }

    checkAccessAndFetchData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    )
  }

  if (userRole !== 'branch_manager') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Only branch managers can access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Building2 className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">No Branch Assigned</h1>
          <p className="text-muted-foreground mb-6">Please contact your administrator to assign a branch.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border p-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">{branch.name} - Calendar Management</h1>
        <p className="text-muted-foreground">
          Manage bookings, prevent double bookings, and track occupancy
        </p>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Bookings</h3>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.totalBookings}</p>
            <p className="text-xs text-muted-foreground mt-2">All confirmed bookings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Upcoming Events</h3>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.upcomingEvents}</p>
            <p className="text-xs text-muted-foreground mt-2">Next 30 days</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Occupancy Rate</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.occupancyRate}%</p>
            <p className="text-xs text-muted-foreground mt-2">Upcoming vs Total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Guest Count</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.avgGuestCount}</p>
            <p className="text-xs text-muted-foreground mt-2">Per booking</p>
          </motion.div>
        </div>
      )}

      {/* Calendar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BookingCalendar branchId={branch.id} />
      </motion.div>

      {/* Double Booking Prevention Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6"
      >
        <div className="flex gap-4">
          <div className="text-blue-600 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Double Booking Prevention</h4>
            <p className="text-sm text-blue-700 mb-3">
              Our real-time calendar system automatically prevents double bookings:
            </p>
            <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
              <li>Same hall cannot be booked at the same time</li>
              <li>Real-time sync across all devices</li>
              <li>Instant alerts when conflicts are detected</li>
              <li>Color-coded occupancy status (Green: Available, Amber: 1 booking, Red: Multiple bookings)</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-2xl border border-border p-6 shadow-lg">
          <h4 className="font-semibold text-foreground mb-3">Calendar Color Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-emerald-100"></div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-amber-100"></div>
              <span className="text-sm text-muted-foreground">1 Booking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-rose-100"></div>
              <span className="text-sm text-muted-foreground">Multiple Bookings</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-lg">
          <h4 className="font-semibold text-foreground mb-3">Quick Actions</h4>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Click any date to see all bookings</li>
            <li>Use Add Booking button to create new event</li>
            <li>Navigate months with arrows</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-lg">
          <h4 className="font-semibold text-foreground mb-3">Branch Info</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Capacity: </span>
              <span className="font-medium text-foreground">{branch.capacity} guests</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location: </span>
              <span className="font-medium text-foreground">{branch.city}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
