'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBranches } from '@/lib/server-actions'
import { AlertTriangle, Plus, TrendingDown, Package, Bell, Loader2 } from 'lucide-react'

const supplyStatusColors = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100' },
  low: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  healthy: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100' },
}

export default function SuppliesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [supplies, setSupplies] = useState<any[]>([])

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      loadSupplies(selectedBranch)
    }
  }, [selectedBranch])

  async function loadBranches() {
    try {
      const data = await getBranches()
      setBranches(data || [])
      if (data?.length) {
        setSelectedBranch(data[0].id)
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  async function loadSupplies(branchId: string) {
    setLoading(true)
    try {
      // Mock supplies with status
      const mockSupplies = [
        {
          id: '1',
          itemName: 'Decorative Plates',
          available: 5,
          threshold: 20,
          unit: 'pcs',
          status: 'critical',
          lastRestocked: '2024-01-20',
        },
        {
          id: '2',
          itemName: 'Table Covers',
          available: 15,
          threshold: 30,
          unit: 'pcs',
          status: 'low',
          lastRestocked: '2024-01-15',
        },
        {
          id: '3',
          itemName: 'Centerpieces',
          available: 35,
          threshold: 15,
          unit: 'pcs',
          status: 'healthy',
          lastRestocked: '2024-01-25',
        },
        {
          id: '4',
          itemName: 'Chair Covers',
          available: 45,
          threshold: 50,
          unit: 'pcs',
          status: 'medium',
          lastRestocked: '2024-01-22',
        },
        {
          id: '5',
          itemName: 'Cutlery Sets',
          available: 120,
          threshold: 40,
          unit: 'sets',
          status: 'healthy',
          lastRestocked: '2024-01-23',
        },
      ]
      setSupplies(mockSupplies)
    } catch (error) {
      console.error('Error loading supplies:', error)
    } finally {
      setLoading(false)
    }
  }

  const criticalItems = supplies.filter((s) => s.status === 'critical')
  const lowItems = supplies.filter((s) => s.status === 'low')
  const healthyItems = supplies.filter((s) => s.status === 'healthy')

  const getStatusLabel = (available: number, threshold: number) => {
    const percentage = (available / threshold) * 100
    if (percentage <= 25) return 'critical'
    if (percentage <= 50) return 'low'
    if (percentage <= 100) return 'medium'
    return 'healthy'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
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
          <h1 className="text-3xl font-bold text-foreground">Supply Management</h1>
          <p className="text-muted-foreground mt-2">Monitor supplies across branches with real-time alerts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus size={20} />
          Add Supply
        </motion.button>
      </motion.div>

      {/* Branch Selection & Alerts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-border p-4 space-y-4"
      >
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all w-full md:w-64"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>

        {/* Alert Summary */}
        {criticalItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <Bell className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-700">{criticalItems.length} Critical Items Need Restock</p>
              <p className="text-sm text-red-600">Immediate action required</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Status Overview Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Critical', count: criticalItems.length, color: 'from-red-50 to-red-100' },
          { label: 'Low Stock', count: lowItems.length, color: 'from-amber-50 to-amber-100' },
          { label: 'Total Items', count: supplies.length, color: 'from-blue-50 to-blue-100' },
          { label: 'Healthy', count: healthyItems.length, color: 'from-emerald-50 to-emerald-100' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className={`rounded-xl p-6 bg-gradient-to-br ${stat.color} border border-white/50`}
          >
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.count}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Supplies List by Status */}
      {loading ? (
        <motion.div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Critical Items */}
          {criticalItems.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Critical - Restock Immediately
              </h3>
              <AnimatePresence>
                {criticalItems.map((item) => (
                  <SupplyCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Low Stock Items */}
          {lowItems.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                Low Stock - Plan Reorder
              </h3>
              <AnimatePresence>
                {lowItems.map((item) => (
                  <SupplyCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Healthy Items */}
          {healthyItems.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Adequate Stock
              </h3>
              <AnimatePresence>
                {healthyItems.map((item) => (
                  <SupplyCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function SupplyCard({ item }: { item: any }) {
  const statusColor = supplyStatusColors[item.status as keyof typeof supplyStatusColors] || supplyStatusColors.healthy
  const percentage = (item.available / item.threshold) * 100

  return (
    <motion.div
      layout
      className={`rounded-xl border p-5 transition-all ${statusColor.bg} ${statusColor.border}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <motion.div className={`w-12 h-12 rounded-lg ${statusColor.badge} flex items-center justify-center flex-shrink-0`}>
            <Package className={`w-6 h-6 ${statusColor.text}`} />
          </motion.div>
          <div className="flex-1">
            <p className={`font-bold ${statusColor.text}`}>{item.itemName}</p>
            <p className="text-xs text-muted-foreground mt-1">Unit: {item.unit}</p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-2xl font-bold ${statusColor.text}`}>
            {item.available}/{item.threshold}
          </p>
          <div className="w-32 h-2 bg-white/50 rounded-full mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className={`h-full rounded-full ${
                item.status === 'critical'
                  ? 'bg-red-500'
                  : item.status === 'low'
                    ? 'bg-amber-500'
                    : item.status === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
              }`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{Math.round(percentage)}% available</p>
        </div>
      </div>
    </motion.div>
  )
}
