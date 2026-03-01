'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, AlertCircle, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Booking {
  id: string
  client_name: string
  event_date: string
  event_time: string
  hall_name: string
  guest_count: number
  status: string
}

interface CalendarDay {
  date: Date
  bookings: Booking[]
  isCurrentMonth: boolean
}

export function BookingCalendar({ branchId }: { branchId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [doubleBookingWarning, setDoubleBookingWarning] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch bookings in real-time
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('branch_id', branchId)
          .gte('event_date', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0])
          .lte('event_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0])
          .eq('status', 'confirmed')

        if (error) throw error

        setBookings(data || [])
        setLoading(false)
      } catch (err) {
        console.error('[v0] Error fetching bookings:', err)
        setLoading(false)
      }
    }

    fetchBookings()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`bookings:${branchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [branchId, currentDate, supabase])

  // Generate calendar grid
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: CalendarDay[] = []
    const currentDateStr = new Date().toISOString().split('T')[0]

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayBookings = bookings.filter((b) => b.event_date === dateStr)

      days.push({
        date,
        bookings: dayBookings,
        isCurrentMonth: date.getMonth() === month,
      })
    }

    setCalendarDays(days)
  }, [bookings, currentDate])

  // Check for double bookings
  const checkDoubleBooking = (date: string, time: string, hall: string) => {
    const existingBooking = bookings.find(
      (b) => b.event_date === date && b.event_time === time && b.hall_name === hall
    )
    return existingBooking ? `Hall "${hall}" is already booked at ${time} on this date!` : null
  }

  // Get hall color based on booking count
  const getHallColor = (hallName: string, dateStr: string) => {
    const hallBookings = bookings.filter((b) => b.event_date === dateStr && b.hall_name === hallName)
    if (hallBookings.length >= 2) return 'bg-rose-100 text-rose-900'
    if (hallBookings.length === 1) return 'bg-amber-100 text-amber-900'
    return 'bg-emerald-100 text-emerald-900'
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Booking Calendar</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Booking
        </motion.button>
      </div>

      {/* Double Booking Warning */}
      <AnimatePresence>
        {doubleBookingWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900">Double Booking Detected</p>
              <p className="text-sm text-rose-700">{doubleBookingWarning}</p>
            </div>
            <button
              onClick={() => setDoubleBookingWarning(null)}
              className="text-rose-600 hover:text-rose-700"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={previousMonth}
          className="p-2 hover:bg-secondary rounded-lg transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </motion.button>

        <h3 className="text-xl font-semibold text-foreground">{monthName}</h3>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-2 hover:bg-secondary rounded-lg transition-all"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </motion.button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const dateStr = day.date.toISOString().split('T')[0]
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              const isSelected = selectedDate === dateStr

              return (
                <motion.div
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  whileHover={{ scale: 1.05 }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all min-h-24 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  } ${!day.isCurrentMonth ? 'opacity-30 bg-muted' : ''} ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="text-sm font-semibold text-foreground mb-2">
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-xs p-1 rounded ${getHallColor(
                          booking.hall_name,
                          dateStr
                        )}`}
                        title={`${booking.client_name} - ${booking.hall_name} at ${booking.event_time}`}
                      >
                        <div className="font-medium truncate">{booking.hall_name}</div>
                        <div className="text-xs opacity-75">{booking.event_time}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-secondary rounded-lg border border-border"
        >
          <h4 className="font-semibold text-foreground mb-3">
            Bookings for {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h4>
          {bookings
            .filter((b) => b.event_date === selectedDate)
            .length > 0 ? (
            <div className="space-y-2">
              {bookings
                .filter((b) => b.event_date === selectedDate)
                .map((booking) => (
                  <div key={booking.id} className="p-3 bg-background rounded border border-border">
                    <div className="font-medium text-foreground">{booking.client_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.hall_name} at {booking.event_time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.guest_count} guests
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No bookings scheduled for this date</p>
          )}
        </motion.div>
      )}

      {/* Add Booking Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddBookingModal
            branchId={branchId}
            onClose={() => setShowAddModal(false)}
            onCheckDoubleBooking={checkDoubleBooking}
            onWarning={setDoubleBookingWarning}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AddBookingModal({
  branchId,
  onClose,
  onCheckDoubleBooking,
  onWarning,
}: {
  branchId: string
  onClose: () => void
  onCheckDoubleBooking: (date: string, time: string, hall: string) => string | null
  onWarning: (warning: string | null) => void
}) {
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    event_date: '',
    event_time: '',
    hall_name: '',
    guest_count: '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const warning = onCheckDoubleBooking(formData.event_date, formData.event_time, formData.hall_name)
    if (warning) {
      onWarning(warning)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('bookings').insert([
        {
          branch_id: branchId,
          client_name: formData.client_name,
          email: formData.email,
          phone: formData.phone,
          event_date: formData.event_date,
          event_time: formData.event_time,
          hall_name: formData.hall_name,
          guest_count: parseInt(formData.guest_count),
          status: 'confirmed',
        },
      ])

      if (error) throw error

      onClose()
      setFormData({
        client_name: '',
        email: '',
        phone: '',
        event_date: '',
        event_time: '',
        hall_name: '',
        guest_count: '',
      })
    } catch (err) {
      console.error('[v0] Error adding booking:', err)
      onWarning('Failed to add booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-border p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Add New Booking</h3>
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <X className="w-6 h-6 text-foreground" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Client Name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              required
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Guest Count"
              value={formData.guest_count}
              onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
              required
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="time"
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              required
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Hall Name"
              value={formData.hall_name}
              onChange={(e) => setFormData({ ...formData, hall_name: e.target.value })}
              required
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary col-span-2"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-75"
          >
            {loading ? 'Adding Booking...' : 'Add Booking'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}
