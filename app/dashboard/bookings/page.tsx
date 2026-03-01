'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBookings, getBranches } from '@/lib/server-actions'
import { Plus, Search, Calendar, Users, Loader2, ChevronRight } from 'lucide-react'

const statusColors = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  tentative: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      loadBookings(selectedBranch)
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

  async function loadBookings(branchId: string) {
    setLoading(true)
    try {
      const bookingsData = await getBookings(branchId)
      setBookings(bookingsData || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || booking.booking_status === filterStatus
    return matchesSearch && matchesStatus
  })

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

  // Sort by event date
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col md:flex-row gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-2">Manage all your event bookings and schedules</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus size={20} />
          New Booking
        </motion.button>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-border p-4 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search bookings by client name or email..."
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
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'confirmed', 'tentative', 'cancelled'].map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {status === 'all' ? 'All Bookings' : status.charAt(0).toUpperCase() + status.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Bookings List */}
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
            {sortedBookings.length > 0 ? (
              sortedBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  variants={itemVariants}
                  exit={{ opacity: 0, x: -100 }}
                  layout
                  className="bg-white rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all"
                >
                  <motion.button
                    onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                    className="w-full p-5 text-left hover:bg-secondary/30 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center font-bold text-accent flex-shrink-0"
                      >
                        {booking.client_name.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{booking.client_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar size={14} />
                          {new Date(booking.event_date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{(booking.total_amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{booking.guest_count || 0} guests</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusColors[booking.booking_status as keyof typeof statusColors]}`}>
                        {booking.booking_status}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedBooking === booking.id ? 90 : 0 }}
                        className="text-muted-foreground flex-shrink-0"
                      >
                        <ChevronRight size={20} />
                      </motion.div>
                    </div>
                  </motion.button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedBooking === booking.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border bg-secondary/20 px-5 py-4 space-y-4"
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <p className="text-sm text-muted-foreground font-semibold mb-3">Event Information</p>
                            <div className="space-y-2 text-sm">
                              <p className="text-foreground"><span className="font-medium">Time:</span> {booking.event_time || 'Not set'}</p>
                              <p className="text-foreground"><span className="font-medium">Type:</span> {booking.event_type || 'General'}</p>
                              <p className="text-foreground"><span className="font-medium">Hall:</span> {booking.hall_type || 'Not specified'}</p>
                              <p className="text-foreground"><span className="font-medium">Guests:</span> {booking.guest_count || 0}</p>
                            </div>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <p className="text-sm text-muted-foreground font-semibold mb-3">Financial Details</p>
                            <div className="space-y-2 text-sm">
                              <p className="text-foreground"><span className="font-medium">Total Amount:</span> ₹{(booking.total_amount || 0).toLocaleString()}</p>
                              <p className="text-foreground"><span className="font-medium">Advance Paid:</span> ₹{(booking.advance_amount || 0).toLocaleString()}</p>
                              <p className="text-foreground"><span className="font-medium">Balance:</span> ₹{((booking.total_amount || 0) - (booking.advance_amount || 0)).toLocaleString()}</p>
                            </div>
                          </motion.div>
                        </div>
                        {booking.notes && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="p-3 bg-background rounded-lg border border-border"
                          >
                            <p className="text-xs text-muted-foreground font-semibold mb-2">Special Notes</p>
                            <p className="text-sm text-foreground">{booking.notes}</p>
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex gap-3 pt-2"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                          >
                            Edit Booking
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                          >
                            View Event
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-xl border border-border border-dashed"
              >
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No bookings found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a new booking to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
