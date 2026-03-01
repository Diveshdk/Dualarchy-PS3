'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBranches } from '@/lib/server-actions'
import { generateBookingRecommendation } from '@/lib/ai'
import {
  Star,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  Sparkles,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

export default function BranchPriorityPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [priorities, setPriorities] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [testBooking, setTestBooking] = useState({ guestCount: 150, budget: 500000 })

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      const data = await getBranches()
      setBranches(data || [])

      // Initialize priorities
      const initialPriorities = new Map()
      data?.forEach((branch: any, index: number) => {
        initialPriorities.set(branch.id, index)
      })
      setPriorities(initialPriorities)
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePriorityChange = (branchId: string, direction: 'up' | 'down') => {
    const currentPriority = priorities.get(branchId) || 0
    const newPriority = direction === 'up' ? currentPriority - 1 : currentPriority + 1

    if (newPriority >= 0 && newPriority < branches.length) {
      const newPriorities = new Map(priorities)
      const conflictingBranch = Array.from(priorities.entries()).find(([_, p]) => p === newPriority)?.[0]

      if (conflictingBranch) {
        newPriorities.set(conflictingBranch, currentPriority)
      }
      newPriorities.set(branchId, newPriority)
      setPriorities(newPriorities)
    }
  }

  async function handleGetRecommendation() {
    setAnalyzing(true)
    try {
      const availableBranches = branches
        .map((b) => ({
          branchName: b.name,
          capacity: b.max_capacity || 500,
          available: Math.random() > 0.3, // 70% available
          distance: Math.floor(Math.random() * 50),
          priceLevel: (['budget', 'mid', 'premium'] as const)[Math.floor(Math.random() * 3)],
        }))
        .sort((a, b) => {
          const aPriority = priorities.get(branches.find((br: any) => br.name === a.branchName)?.id || '') || 999
          const bPriority = priorities.get(branches.find((br: any) => br.name === b.branchName)?.id || '') || 999
          return aPriority - bPriority
        })

      const result = await generateBookingRecommendation(availableBranches, {
        guestCount: testBooking.guestCount,
        budget: testBooking.budget,
      })
      setRecommendation(result)
    } catch (error) {
      console.error('Error generating recommendation:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const sortedBranches = branches.sort((a, b) => {
    const aPriority = priorities.get(a.id) || 999
    const bPriority = priorities.get(b.id) || 999
    return aPriority - bPriority
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
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
          <h1 className="text-3xl font-bold text-foreground">Branch Priority Management</h1>
          <p className="text-muted-foreground mt-2">Set booking priorities by branch - system recommends alternatives when full</p>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">How It Works</p>
          <p className="text-sm text-blue-700 mt-1">
            Arrange branches in your preferred booking order. When the top-priority branch is full, customers will be recommended
            the next available option.
          </p>
        </div>
      </motion.div>

      {/* Test Booking Settings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl border border-border p-6 space-y-4"
      >
        <h3 className="font-bold text-foreground">Test Recommendation Engine</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Guest Count</label>
            <input
              type="number"
              value={testBooking.guestCount}
              onChange={(e) => setTestBooking({ ...testBooking, guestCount: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Budget (₹)</label>
            <input
              type="number"
              value={testBooking.budget}
              onChange={(e) => setTestBooking({ ...testBooking, budget: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetRecommendation}
              disabled={analyzing}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-75"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Recommendation
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Branch Priority List */}
      {loading ? (
        <motion.div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {sortedBranches.map((branch, idx) => (
            <motion.div
              key={branch.id}
              variants={itemVariants}
              layout
              className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Priority Badge */}
                <motion.div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-lg text-primary flex-shrink-0">
                  {idx + 1}
                </motion.div>

                {/* Branch Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-bold text-foreground">{branch.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Capacity: {branch.max_capacity || '-'}
                    </span>
                    <span>{branch.location}</span>
                  </div>
                </div>

                {/* Priority Controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePriorityChange(branch.id, 'up')}
                    disabled={idx === 0}
                    className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePriorityChange(branch.id, 'down')}
                    disabled={idx === sortedBranches.length - 1}
                    className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* AI Recommendation Results */}
      <AnimatePresence>
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-foreground">Smart Booking Recommendation</h2>
            </div>

            {/* Primary Recommendation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 border-l-4 border-emerald-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-foreground">Top Recommendation</h3>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 mb-3">{recommendation.primaryRecommendation}</p>
                  <p className="text-sm text-foreground">{recommendation.recommendationReason}</p>
                </div>
                <Star className="w-8 h-8 text-amber-500 fill-amber-500 flex-shrink-0" />
              </div>
            </motion.div>

            {/* Backup Options */}
            {recommendation.backupOptions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6"
              >
                <h3 className="font-bold text-foreground mb-4">Backup Options</h3>
                <div className="space-y-3">
                  {(recommendation.backupOptions || []).map((option: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-muted-foreground">Option {i + 1}</span>
                      <span className="text-foreground font-medium">{option}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Price Comparison */}
            {recommendation.priceComparison && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6"
              >
                <h3 className="font-bold text-foreground mb-2">Price Comparison</h3>
                <p className="text-sm text-foreground">{recommendation.priceComparison}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
