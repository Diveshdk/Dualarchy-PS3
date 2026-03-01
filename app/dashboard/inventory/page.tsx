'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBranches } from '@/lib/server-actions'
import { Package, AlertTriangle, Plus, Search, Loader2, TrendingDown } from 'lucide-react'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterLowStock, setFilterLowStock] = useState(false)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      loadInventory(selectedBranch)
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

  async function loadInventory(branchId: string) {
    setLoading(true)
    try {
      // Mock inventory data for demonstration
      const mockInventory = [
        { id: '1', item_name: 'Decorative Plates', unit: 'pcs', quantity_available: 45, min_threshold: 20 },
        { id: '2', item_name: 'Table Covers', unit: 'pcs', quantity_available: 12, min_threshold: 30 },
        { id: '3', item_name: 'Centerpieces', unit: 'pcs', quantity_available: 28, min_threshold: 15 },
        { id: '4', item_name: 'Chair Covers', unit: 'pcs', quantity_available: 8, min_threshold: 50 },
        { id: '5', item_name: 'Cutlery Sets', unit: 'sets', quantity_available: 92, min_threshold: 40 },
      ]
      setInventory(mockInventory)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    const isLowStock = item.quantity_available <= (item.min_threshold || 0)
    return matchesSearch && (!filterLowStock || isLowStock)
  })

  const lowStockItems = inventory.filter((item) => item.quantity_available <= (item.min_threshold || 0)).length
  const totalItems = inventory.length

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
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage your stock levels efficiently</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus size={20} />
          Add Item
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {[
          { label: 'Total Items', value: totalItems, color: 'from-blue-50 to-blue-100', icon: Package },
          { label: 'Low Stock Alert', value: lowStockItems, color: 'from-rose-50 to-rose-100', icon: AlertTriangle },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`rounded-xl p-6 bg-gradient-to-br ${stat.color} border border-white/50 flex items-center justify-between`}
            >
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <Icon className="w-12 h-12 text-gray-900/20" />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-border p-4 flex gap-4 flex-col md:flex-row"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            filterLowStock ? 'bg-rose-100 text-rose-700' : 'bg-secondary text-foreground hover:bg-secondary/80'
          }`}
        >
          <TrendingDown size={20} />
          Low Stock
        </motion.button>
      </motion.div>

      {/* Inventory List */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-64"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-8 h-8 text-primary" />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => {
                const isLowStock = item.quantity_available <= (item.min_threshold || 0)
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                    className={`bg-white rounded-xl border overflow-hidden hover:border-primary/50 transition-all ${
                      isLowStock ? 'border-rose-200' : 'border-border'
                    }`}
                  >
                    <motion.div className="p-5 flex items-center justify-between group hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-primary" />
                        </motion.div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{item.item_name}</p>
                          <p className="text-sm text-muted-foreground">Unit: {item.unit || 'pcs'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{item.quantity_available}</p>
                          <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                        {isLowStock && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="p-2 bg-rose-50 rounded-lg"
                          >
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-xl border border-border border-dashed"
              >
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No inventory items found</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
