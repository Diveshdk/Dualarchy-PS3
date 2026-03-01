'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBookings } from '@/lib/server-actions'
import { generateEventAnalysis } from '@/lib/ai'
import {
  BarChart3,
  TrendingUp,
  Users,
  IndianRupee,
  Download,
  Loader2,
  Sparkles,
  Calendar,
  CheckCircle,
} from 'lucide-react'

export default function EventAnalysisPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    try {
      const data = await getBookings()
      setBookings(data || [])
      if (data?.length) {
        setSelectedEvent(data[0].id)
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyzeEvent() {
    setAnalyzing(true)
    try {
      const event = bookings.find((b) => b.id === selectedEvent)
      if (!event) return

      const analysisData = {
        clientName: event.client_name,
        eventType: event.event_type,
        guestCount: event.guest_count || 100,
        eventDate: event.event_date,
        totalAmount: event.total_amount || 500000,
        advancePaid: event.advance_paid || 250000,
        notes: event.notes || '',
      }

      const result = await generateEventAnalysis(analysisData)
      setAnalysis(result)
    } catch (error) {
      console.error('Error analyzing event:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const selectedEventData = bookings.find((b) => b.id === selectedEvent)

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
          <h1 className="text-3xl font-bold text-foreground">Event Analysis & Reports</h1>
          <p className="text-muted-foreground mt-2">AI-powered insights on event performance and metrics</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Download size={20} />
          Export Report
        </motion.button>
      </motion.div>

      {/* Event Selection */}
      {loading ? (
        <motion.div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-border p-6 space-y-4"
          >
            <div className="flex items-center justify-between flex-col md:flex-row gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-foreground mb-2">Select Event</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  {bookings.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.client_name} - {event.event_type} ({new Date(event.event_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAnalyzeEvent}
                disabled={analyzing || !selectedEvent}
                className="mt-6 md:mt-0 bg-primary text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-75 whitespace-nowrap"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Event
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Event Summary Cards */}
          {selectedEventData && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Event Type</p>
                    <p className="text-lg font-bold text-foreground mt-1">{selectedEventData.event_type}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary/30" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Guest Count</p>
                    <p className="text-lg font-bold text-foreground mt-1">{selectedEventData.guest_count || '-'}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500/30" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-bold text-foreground mt-1">₹{(selectedEventData.total_amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <IndianRupee className="w-8 h-8 text-emerald-500/30" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-5 h-5" />
                      Completed
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-emerald-500/30" />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* AI Analysis Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-8 space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-foreground">AI Event Analysis Report</h2>
                </div>

                {/* Event Success Metrics */}
                {analysis.metrics && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Success Metrics
                    </h3>
                    {typeof analysis.metrics === 'string' ? (
                      <p className="text-sm text-foreground">{analysis.metrics}</p>
                    ) : Array.isArray(analysis.metrics) ? (
                      <ul className="space-y-3">
                        {analysis.metrics.map((metric: string, i: number) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg"
                          >
                            <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-foreground">{metric}</span>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-foreground">{JSON.stringify(analysis.metrics)}</p>
                    )}
                  </motion.div>
                )}

                {/* Revenue Analysis */}
                {analysis.revenue && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-emerald-600" />
                      Revenue Analysis
                    </h3>
                    <p className="text-sm text-foreground">{analysis.revenue}</p>
                  </motion.div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <h3 className="font-bold text-foreground mb-4">Guest Experience Recommendations</h3>
                    <p className="text-sm text-foreground">{analysis.recommendations}</p>
                  </motion.div>
                )}

                {/* Logistics Optimization */}
                {analysis.logistics && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Logistics Optimization
                    </h3>
                    <p className="text-sm text-foreground">{analysis.logistics}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
