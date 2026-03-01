'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBranches } from '@/lib/server-actions'
import { generateBranchComparison } from '@/lib/ai'
import { Building2, TrendingUp, Users, IndianRupee, Loader2, Sparkles } from 'lucide-react'

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      const data = await getBranches()
      setBranches(data || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      // Mock branch stats for demo
      const stats = branches.map((b) => ({
        name: b.name,
        totalBookings: Math.floor(Math.random() * 50) + 10,
        totalRevenue: Math.floor(Math.random() * 5000000) + 1000000,
        conversionRate: Math.floor(Math.random() * 40) + 20,
        avgGuestCount: Math.floor(Math.random() * 200) + 50,
        avgBookingValue: Math.floor(Math.random() * 500000) + 100000,
      }))

      const result = await generateBranchComparison(stats)
      setAnalysis(result)
    } catch (error) {
      console.error('Error analyzing branches:', error)
    } finally {
      setAnalyzing(false)
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
          <h1 className="text-3xl font-bold text-foreground">Branch Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and compare performance across all branches</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAnalyze}
          disabled={analyzing || loading}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all whitespace-nowrap disabled:opacity-75"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              AI Analysis
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Branch Cards */}
      {loading ? (
        <motion.div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-6"
        >
          {branches.map((branch, idx) => (
            <motion.div
              key={branch.id}
              variants={itemVariants}
              className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{branch.name}</h3>
                    <p className="text-xs text-muted-foreground">{branch.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="font-bold text-foreground">{branch.max_capacity || '-'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700 font-medium">Contact</span>
                  <span className="text-sm text-blue-900">{branch.phone || branch.email || '-'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* AI Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">AI Branch Analysis</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Performer */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg p-6 border-l-4 border-emerald-500"
              >
                <h3 className="font-bold text-foreground mb-2">Top Performer</h3>
                <p className="text-2xl font-bold text-emerald-600">{analysis.topPerformer}</p>
                <p className="text-sm text-muted-foreground mt-3">{analysis.topPerformerInsights}</p>
              </motion.div>

              {/* Underperformer */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg p-6 border-l-4 border-amber-500"
              >
                <h3 className="font-bold text-foreground mb-2">Needs Improvement</h3>
                <p className="text-2xl font-bold text-amber-600">{analysis.underperformer}</p>
                <p className="text-sm text-muted-foreground mt-3">Focus area for growth</p>
              </motion.div>
            </div>

            {/* Improvement Tips */}
            {analysis.improvementTips && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6"
              >
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Improvement Tips
                </h3>
                <ul className="space-y-3">
                  {(analysis.improvementTips || []).map((tip: string, i: number) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground">{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Scaling Recommendations */}
            {analysis.scalingRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6"
              >
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  Growth Recommendations
                </h3>
                <p className="text-sm text-foreground">{analysis.scalingRecommendations}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
