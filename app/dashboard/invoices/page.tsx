'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBranches } from '@/lib/server-actions'
import { FileText, Search, Download, Loader2, ChevronRight } from 'lucide-react'

const paymentStatusColors = {
  pending: 'bg-rose-50 text-rose-700 border-rose-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      loadInvoices(selectedBranch)
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

  async function loadInvoices(branchId: string) {
    setLoading(true)
    try {
      // Mock invoices data for demonstration
      const mockInvoices = [
        { id: '1', invoice_number: 'INV-001', invoice_date: new Date(2024, 0, 15), total_amount: 250000, paid_amount: 250000, balance_amount: 0, payment_status: 'paid', subtotal: 212000, gst_amount: 38000, due_date: new Date(2024, 0, 20) },
        { id: '2', invoice_number: 'INV-002', invoice_date: new Date(2024, 0, 20), total_amount: 180000, paid_amount: 100000, balance_amount: 80000, payment_status: 'partial', subtotal: 152500, gst_amount: 27500, due_date: new Date(2024, 0, 27) },
        { id: '3', invoice_number: 'INV-003', invoice_date: new Date(2024, 0, 25), total_amount: 150000, paid_amount: 0, balance_amount: 150000, payment_status: 'pending', subtotal: 127100, gst_amount: 22900, due_date: new Date(2024, 1, 1) },
      ]
      setInvoices(mockInvoices)
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const paidAmount = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0)
  const pendingAmount = totalAmount - paidAmount

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-col md:flex-row gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-2">Track and manage all your invoice payments</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4"
      >
        {[
          { label: 'Total Amount', value: totalAmount, color: 'from-blue-50 to-blue-100' },
          { label: 'Amount Received', value: paidAmount, color: 'from-emerald-50 to-emerald-100' },
          { label: 'Amount Pending', value: pendingAmount, color: 'from-amber-50 to-amber-100' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`rounded-xl p-6 bg-gradient-to-br ${card.color} border border-white/50`}
          >
            <p className="text-sm text-gray-600 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{(card.value / 100000).toFixed(2)}L</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-border p-4 flex gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number..."
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

      {/* Invoices List */}
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
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  variants={itemVariants}
                  exit={{ opacity: 0, x: -100 }}
                  layout
                  className="bg-white rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all"
                >
                  <motion.button
                    onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                    className="w-full p-5 text-left hover:bg-secondary/30 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <motion.div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </motion.div>
                      <div>
                        <p className="font-bold text-foreground">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{(invoice.total_amount || 0).toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border inline-block mt-1 ${paymentStatusColors[invoice.payment_status as keyof typeof paymentStatusColors]}`}>
                          {invoice.payment_status}
                        </span>
                      </div>
                      <motion.div animate={{ rotate: expandedInvoice === invoice.id ? 90 : 0 }}>
                        <ChevronRight size={20} />
                      </motion.div>
                    </div>
                  </motion.button>

                  {expandedInvoice === invoice.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-secondary/20 px-5 py-4 space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-3">Amount Details</p>
                          <div className="space-y-2 text-sm">
                            <p className="text-foreground"><span className="font-medium">Subtotal:</span> ₹{(invoice.subtotal || 0).toLocaleString()}</p>
                            <p className="text-foreground"><span className="font-medium">GST (18%):</span> ₹{(invoice.gst_amount || 0).toLocaleString()}</p>
                            <p className="text-foreground"><span className="font-medium">Total:</span> ₹{(invoice.total_amount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-3">Payment Details</p>
                          <div className="space-y-2 text-sm">
                            <p className="text-foreground"><span className="font-medium">Paid:</span> ₹{(invoice.paid_amount || 0).toLocaleString()}</p>
                            <p className="text-foreground"><span className="font-medium">Balance:</span> ₹{(invoice.balance_amount || 0).toLocaleString()}</p>
                            <p className="text-foreground"><span className="font-medium">Due Date:</span> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="w-full bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                      >
                        <Download size={18} />
                        Download Invoice
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-xl border border-border border-dashed"
              >
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No invoices found</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
