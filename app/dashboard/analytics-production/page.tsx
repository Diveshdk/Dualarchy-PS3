'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, Package } from 'lucide-react'

interface BranchRevenue {
  name: string
  revenue: number
  bookings: number
  conversionRate: number
}

interface SalesPerformance {
  name: string
  leads: number
  conversions: number
  revenue: number
  conversionRate: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface InventoryHealth {
  branch: string
  lowStock: number
  healthy: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ProductionAnalytics() {
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [branchRevenue, setBranchRevenue] = useState<BranchRevenue[]>([])
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth[]>([])
  const [personalStats, setPersonalStats] = useState({
    totalLeads: 0,
    wonLeads: 0,
    conversionRate: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setUserRole(profile?.role || '')
    setUserId(user.id)

    if (profile?.role === 'owner') {
      await loadOwnerAnalytics(user.id)
    } else if (profile?.role === 'branch_manager') {
      await loadManagerAnalytics(user.id)
    } else if (profile?.role === 'sales') {
      await loadSalesAnalytics(user.id)
    }

    setLoading(false)
  }

  const loadOwnerAnalytics = async (ownerId: string) => {
    // Get branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('owner_id', ownerId)

    if (!branches) return

    // Get bookings per branch
    const revenueData: BranchRevenue[] = []
    for (const branch of branches) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_cost')
        .eq('branch_id', branch.id)

      const { data: leads } = await supabase
        .from('leads')
        .select('status')
        .eq('branch_id', branch.id)

      const revenue = bookings?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0
      const totalLeads = leads?.length || 0
      const wonLeads = leads?.filter(l => l.status === 'won').length || 0
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

      revenueData.push({
        name: branch.name,
        revenue,
        bookings: bookings?.length || 0,
        conversionRate: Math.round(conversionRate)
      })
    }

    setBranchRevenue(revenueData)

    // Get monthly revenue (last 6 months)
    const monthlyData: MonthlyRevenue[] = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    for (let i = 0; i < 6; i++) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_cost')
        .gte('created_at', new Date(Date.now() - (6-i) * 30 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - (5-i) * 30 * 24 * 60 * 60 * 1000).toISOString())

      const revenue = bookings?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0
      monthlyData.push({
        month: months[i],
        revenue: Math.round(revenue)
      })
    }

    setMonthlyRevenue(monthlyData)

    // Get inventory health per branch
    const inventoryData: InventoryHealth[] = []
    for (const branch of branches) {
      const { data: supplies } = await supabase
        .from('food_supplies')
        .select('quantity, threshold')
        .eq('branch_id', branch.id)

      const lowStock = supplies?.filter(s => s.quantity <= s.threshold).length || 0
      const healthy = (supplies?.length || 0) - lowStock

      inventoryData.push({
        branch: branch.name,
        lowStock,
        healthy
      })
    }

    setInventoryHealth(inventoryData)
  }

  const loadManagerAnalytics = async (managerId: string) => {
    // Get manager's branch
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', managerId)
      .single()

    if (!profile?.branch_id) return

    // Get sales team performance
    const { data: salesExecs } = await supabase
      .from('sales_executives')
      .select('sales_id, email')
      .eq('branch_id', profile.branch_id)

    if (!salesExecs) return

    const performanceData: SalesPerformance[] = []
    for (const sales of salesExecs) {
      const { data: salesProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sales.sales_id)
        .single()

      const { data: leads } = await supabase
        .from('leads')
        .select('status, estimated_budget')
        .eq('sales_id', sales.sales_id)

      const totalLeads = leads?.length || 0
      const wonLeads = leads?.filter(l => l.status === 'won').length || 0
      const revenue = leads?.filter(l => l.status === 'won')
        .reduce((sum, l) => sum + (l.estimated_budget || 0), 0) || 0
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

      performanceData.push({
        name: salesProfile?.full_name || sales.email,
        leads: totalLeads,
        conversions: wonLeads,
        revenue,
        conversionRate: Math.round(conversionRate)
      })
    }

    setSalesPerformance(performanceData)

    // Get monthly revenue for branch
    const monthlyData: MonthlyRevenue[] = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    for (let i = 0; i < 6; i++) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_cost')
        .eq('branch_id', profile.branch_id)
        .gte('created_at', new Date(Date.now() - (6-i) * 30 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - (5-i) * 30 * 24 * 60 * 60 * 1000).toISOString())

      const revenue = bookings?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0
      monthlyData.push({
        month: months[i],
        revenue: Math.round(revenue)
      })
    }

    setMonthlyRevenue(monthlyData)
  }

  const loadSalesAnalytics = async (salesId: string) => {
    // Get personal leads
    const { data: leads } = await supabase
      .from('leads')
      .select('status, estimated_budget')
      .eq('sales_id', salesId)

    const totalLeads = leads?.length || 0
    const wonLeads = leads?.filter(l => l.status === 'won').length || 0
    const lostLeads = leads?.filter(l => l.status === 'lost').length || 0
    const activeLeads = totalLeads - wonLeads - lostLeads
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0
    const revenue = leads?.filter(l => l.status === 'won')
      .reduce((sum, l) => sum + (l.estimated_budget || 0), 0) || 0

    setPersonalStats({
      totalLeads,
      wonLeads,
      conversionRate: Math.round(conversionRate),
      totalRevenue: revenue
    })

    // Set funnel data
    setSalesPerformance([
      { name: 'Active Leads', leads: activeLeads, conversions: 0, revenue: 0, conversionRate: 0 },
      { name: 'Won Leads', leads: wonLeads, conversions: 0, revenue: 0, conversionRate: 0 },
      { name: 'Lost Leads', leads: lostLeads, conversions: 0, revenue: 0, conversionRate: 0 }
    ])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Production Analytics</h1>
        <p className="text-muted-foreground">Real-time insights and performance metrics</p>
      </div>

      {/* OWNER VIEW */}
      {userRole === 'owner' && (
        <div className="space-y-6">
          {/* Revenue per Branch */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Branch</CardTitle>
              <CardDescription>Total revenue and bookings per branch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Rate by Branch */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate by Branch</CardTitle>
              <CardDescription>Lead to booking conversion percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversionRate" fill="#82ca9d" name="Conversion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Health */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Health</CardTitle>
              <CardDescription>Low stock vs healthy stock items per branch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryHealth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="healthy" fill="#10b981" stackId="a" name="Healthy Stock" />
                  <Bar dataKey="lowStock" fill="#ef4444" stackId="a" name="Low Stock" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BRANCH MANAGER VIEW */}
      {userRole === 'branch_manager' && (
        <div className="space-y-6">
          {/* Sales Team Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Team Performance</CardTitle>
              <CardDescription>Leaderboard by conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesPerformance.sort((a, b) => b.conversions - a.conversions)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversions" fill="#8884d8" name="Won Leads" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Rate per Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate by Sales Executive</CardTitle>
              <CardDescription>Individual conversion percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversionRate" fill="#82ca9d" name="Conversion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Sales Executive */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Sales Executive</CardTitle>
              <CardDescription>Total revenue generated per sales person</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#fbbf24" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue for your branch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SALES EXECUTIVE VIEW */}
      {userRole === 'sales' && (
        <div className="space-y-6">
          {/* Personal Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalStats.totalLeads}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Won Leads</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalStats.wonLeads}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalStats.conversionRate}%</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{personalStats.totalRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Leads Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Funnel</CardTitle>
              <CardDescription>Your leads breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, leads }) => `${name}: ${leads}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="leads"
                  >
                    {salesPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
