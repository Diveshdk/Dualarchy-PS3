'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDashboardStats, getBranches } from '@/lib/server-actions'
import { BarChart, LineChart, PieChart, TrendingUp, Calendar, Users } from 'lucide-react'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      loadStats(selectedBranch)
    }
  }, [selectedBranch])

  async function loadBranches() {
    try {
      const branchesData = await getBranches()
      setBranches(branchesData || [])
      if (branchesData?.length) {
        setSelectedBranch(branchesData[0].id)
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  async function loadStats(branchId: string) {
    setLoading(true)
    try {
      const statsData = await getDashboardStats(branchId)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col md:flex-row gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">View detailed insights and business metrics</p>
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Key Metrics */}
      {stats && (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-4"
          >
            {[
              { 
                icon: Users, 
                label: 'Total Leads', 
                value: stats.totalLeads, 
                color: 'from-blue-50 to-blue-100',
                subtitle: `${stats.convertedLeads} converted` 
              },
              { 
                icon: TrendingUp, 
                label: 'Conversion Rate', 
                value: `${stats.conversionRate}%`, 
                color: 'from-emerald-50 to-emerald-100',
                subtitle: 'This month' 
              },
              { 
                icon: Calendar, 
                label: 'Total Bookings', 
                value: stats.totalBookings, 
                color: 'from-amber-50 to-amber-100',
                subtitle: `₹${(stats.totalRevenue / 100000).toFixed(1)}L revenue` 
              },
            ].map((metric, i) => {
              const Icon = metric.icon
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className={`rounded-xl p-6 bg-gradient-to-br ${metric.color} border border-white/50`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{metric.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                      <p className="text-xs text-gray-600 mt-2">{metric.subtitle}</p>
                    </div>
                    <Icon className="w-8 h-8 text-gray-900/20" />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Chart Placeholders */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-6"
          >
            {[
              { icon: BarChart, title: 'Revenue Trend', description: 'Monthly revenue analysis' },
              { icon: LineChart, title: 'Lead Pipeline', description: 'Lead status distribution' },
              { icon: PieChart, title: 'Event Types', description: 'Breakdown by event category' },
              { icon: TrendingUp, title: 'Growth Metrics', description: 'Year-over-year comparison' },
            ].map((chart, i) => {
              const Icon = chart.icon
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white rounded-xl border border-border p-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-foreground">{chart.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{chart.description}</p>
                    </div>
                    <Icon className="w-8 h-8 text-primary/30" />
                  </div>
                  <div className="h-48 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart visualization</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </>
      )}
    </div>
  )
}
