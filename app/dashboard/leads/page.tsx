'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLeads, getBranches, convertLeadToBooking, updateLead } from '@/lib/server-actions'
import { Plus, Search, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { NewLeadModal } from '@/components/leads/new-lead-modal'

const statusColors = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  qualified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  advance_paid: 'bg-amber-50 text-amber-700 border-amber-200',
  converted: 'bg-purple-50 text-purple-700 border-purple-200',
  lost: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      loadLeads(selectedBranch)
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

  async function loadLeads(branchId: string) {
    setLoading(true)
    try {
      const leadsData = await getLeads(branchId)
      setLeads(leadsData || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConvertToBooking(lead: any) {
    setConvertingLeadId(lead.id)
    try {
      const booking = await convertLeadToBooking(lead.id, {
        branch_id: selectedBranch,
        client_name: lead.client_name,
        client_email: lead.client_email,
        client_phone: lead.client_phone,
        event_date: lead.event_date,
        event_time: '18:00',
        event_type: lead.event_type,
        hall_type: 'premium',
        guest_count: lead.guest_count || 0,
        total_amount: 0,
        advance_amount: lead.advance_amount || 0,
        booking_status: 'tentative',
        notes: lead.notes || '',
      })

      if (booking) {
        setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'converted' } : l))
        setExpandedLead(null)
      }
    } catch (error) {
      console.error('Error converting lead:', error)
    } finally {
      setConvertingLeadId(null)
    }
  }

  async function handleDeleteLead(leadId: string) {
    try {
      await updateLead(leadId, { status: 'lost' })
      setLeads(leads.filter(l => l.id !== leadId))
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  function handleLeadCreated(newLead: any) {
    setLeads([newLead, ...leads])
  }

  const filteredLeads = leads.filter((lead) =>
    lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.client_email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground mt-2">Track and convert your sales leads efficiently</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewLeadModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus size={20} />
          New Lead
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 bg-white rounded-xl border border-border p-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search leads by name or email..."
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
      </motion.div>

      {/* Leads List */}
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
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  variants={itemVariants}
                  exit={{ opacity: 0, x: -100 }}
                  layout
                  className="bg-white rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                >
                  <motion.div className="p-5 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary flex-shrink-0"
                        >
                          {lead.client_name.charAt(0).toUpperCase()}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{lead.client_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{lead.client_email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusColors[lead.status as keyof typeof statusColors]}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                        <motion.div
                          animate={{ rotate: expandedLead === lead.id ? 90 : 0 }}
                          className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
                        >
                          <ChevronRight size={20} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedLead === lead.id && (
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
                            <p className="text-sm text-muted-foreground font-semibold mb-3">Event Details</p>
                            <div className="space-y-2 text-sm">
                              <p className="text-foreground"><span className="font-medium">Date:</span> {lead.event_date ? new Date(lead.event_date).toLocaleDateString() : 'Not set'}</p>
                              <p className="text-foreground"><span className="font-medium">Type:</span> {lead.event_type || 'Not specified'}</p>
                              <p className="text-foreground"><span className="font-medium">Guests:</span> {lead.guest_count || 'Not specified'}</p>
                            </div>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <p className="text-sm text-muted-foreground font-semibold mb-3">Contact & Financial</p>
                            <div className="space-y-2 text-sm">
                              <p className="text-foreground"><span className="font-medium">Phone:</span> {lead.client_phone || 'Not provided'}</p>
                              <p className="text-foreground"><span className="font-medium">Advance:</span> ₹{(lead.advance_amount || 0).toLocaleString()}</p>
                              <p className="text-foreground"><span className="font-medium">Source:</span> {lead.source || 'Direct'}</p>
                            </div>
                          </motion.div>
                        </div>
                        {lead.notes && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="p-3 bg-background rounded-lg border border-border"
                          >
                            <p className="text-xs text-muted-foreground font-semibold mb-2">Notes</p>
                            <p className="text-sm text-foreground">{lead.notes}</p>
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex gap-3 pt-2"
                        >
                          {lead.status !== 'converted' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleConvertToBooking(lead)
                              }}
                              disabled={convertingLeadId === lead.id}
                              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-75 flex items-center justify-center gap-2"
                            >
                              {convertingLeadId === lead.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Converting...
                                </>
                              ) : (
                                'Convert to Booking'
                              )}
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLead(lead.id)
                            }}
                            className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Remove
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
                <p className="text-muted-foreground font-medium">No leads found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a new lead to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
        branchId={selectedBranch}
        onLeadCreated={handleLeadCreated}
      />
    </div>
  )
}
