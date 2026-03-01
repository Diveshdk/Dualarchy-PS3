'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Plus, CheckCircle2, Circle, DollarSign } from 'lucide-react'

interface Lead {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  status: string
  estimated_budget: number
  checklist: Checklist | null
}

interface Checklist {
  id: string
  call_completed: boolean
  call_date: string | null
  property_visit_completed: boolean
  property_visit_date: string | null
  food_tasting_completed: boolean
  food_tasting_date: string | null
  advance_payment_completed: boolean
  advance_payment_date: string | null
  advance_amount: number | null
  menu_finalized: boolean
  menu_finalized_date: string | null
  decoration_finalized: boolean
  decoration_finalized_date: string | null
  full_payment_completed: boolean
  full_payment_date: string | null
  full_payment_amount: number | null
  post_event_settlement: boolean
  post_event_settlement_date: string | null
  feedback_collected: boolean
  feedback_date: string | null
  feedback_text: string | null
}

export default function EnhancedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [fullPaymentAmount, setFullPaymentAmount] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get leads with checklist - SIMPLE QUERY
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('sales_id', user.id)

    if (!leadsData) {
      setLoading(false)
      return
    }

    // Get checklists for these leads
    const leadIds = leadsData.map(l => l.id)
    const { data: checklistsData } = await supabase
      .from('lead_checklist')
      .select('*')
      .in('lead_id', leadIds)

    // Combine leads with checklists
    const leadsWithChecklists = leadsData.map(lead => ({
      ...lead,
      checklist: checklistsData?.find(c => c.lead_id === lead.id) || null
    }))

    setLeads(leadsWithChecklists)
    setLoading(false)
  }

  const updateChecklistStep = async (
    checklistId: string,
    step: string,
    completed: boolean
  ) => {
    const now = new Date().toISOString()
    const updateData: any = {}
    updateData[step] = completed
    updateData[`${step.replace('_completed', '_date')}`] = completed ? now : null

    const { error } = await supabase
      .from('lead_checklist')
      .update(updateData)
      .eq('id', checklistId)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Updated',
      description: 'Checklist step updated successfully.'
    })

    loadLeads()
  }

  const handleAdvancePayment = async () => {
    if (!selectedLead || !advanceAmount) return

    const amount = parseFloat(advanceAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid advance amount.',
        variant: 'destructive'
      })
      return
    }

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('lead_checklist')
      .update({
        advance_payment_completed: true,
        advance_payment_date: now,
        advance_amount: amount
      })
      .eq('id', selectedLead.checklist!.id)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    // Update lead status to won
    await supabase
      .from('leads')
      .update({ status: 'won' })
      .eq('id', selectedLead.id)

    toast({
      title: 'Advance Payment Recorded!',
      description: 'Lead will be auto-converted to booking. Branch manager will be notified.',
      duration: 5000
    })

    setAdvanceAmount('')
    setSelectedLead(null)
    loadLeads()
  }

  const handleFullPayment = async () => {
    if (!selectedLead || !fullPaymentAmount) return

    const amount = parseFloat(fullPaymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount.',
        variant: 'destructive'
      })
      return
    }

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('lead_checklist')
      .update({
        full_payment_completed: true,
        full_payment_date: now,
        full_payment_amount: amount
      })
      .eq('id', selectedLead.checklist!.id)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Full Payment Recorded!',
      description: 'Payment has been recorded successfully.'
    })

    setFullPaymentAmount('')
    setSelectedLead(null)
    loadLeads()
  }

  const calculateProgress = (checklist: Checklist | null) => {
    if (!checklist) return 0
    const steps = [
      checklist.call_completed,
      checklist.property_visit_completed,
      checklist.food_tasting_completed,
      checklist.advance_payment_completed,
      checklist.menu_finalized,
      checklist.decoration_finalized,
      checklist.full_payment_completed,
      checklist.post_event_settlement,
      checklist.feedback_collected
    ]
    const completed = steps.filter(Boolean).length
    return Math.round((completed / 9) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Enhanced Leads - Lifecycle Management</h1>
        <p className="text-muted-foreground">Manage leads through 9-step sales lifecycle</p>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 gap-4">
        {leads.map((lead) => {
          const progress = calculateProgress(lead.checklist)
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{lead.company_name}</CardTitle>
                      <CardDescription>{lead.contact_name} • {lead.phone}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={lead.status === 'won' ? 'default' : 'outline'}
                      >
                        {lead.status}
                      </Badge>
                      {lead.estimated_budget > 0 && (
                        <p className="text-sm font-medium mt-2">
                          ₹{lead.estimated_budget.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {lead.checklist && (
                    <div className="space-y-3">
                      {/* Step 1: Call */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.call_completed}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'call_completed',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">1. Call Completed</p>
                            {lead.checklist.call_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.call_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.call_completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Step 2: Property Visit */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.property_visit_completed}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'property_visit_completed',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">2. Property Visit</p>
                            {lead.checklist.property_visit_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.property_visit_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.property_visit_completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Step 3: Food Tasting */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.food_tasting_completed}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'food_tasting_completed',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">3. Food Tasting</p>
                            {lead.checklist.food_tasting_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.food_tasting_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.food_tasting_completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Step 4: Advance Payment */}
                      <div className="p-3 border-2 border-primary/50 rounded-lg bg-primary/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {lead.checklist.advance_payment_completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">4. Advance Payment (Auto-converts to Booking)</p>
                              {lead.checklist.advance_payment_date && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(lead.checklist.advance_payment_date).toLocaleDateString()} • 
                                  ₹{lead.checklist.advance_amount?.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {!lead.checklist.advance_payment_completed && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" onClick={() => setSelectedLead(lead)}>
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Collect
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Collect Advance Payment</DialogTitle>
                                  <DialogDescription>
                                    This will auto-convert the lead to a booking
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Advance Amount (₹)</Label>
                                    <Input
                                      type="number"
                                      value={advanceAmount}
                                      onChange={(e) => setAdvanceAmount(e.target.value)}
                                      placeholder="e.g., 50000"
                                    />
                                  </div>
                                  <Button onClick={handleAdvancePayment} className="w-full">
                                    Record Advance Payment
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {/* Step 5: Menu Finalized */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.menu_finalized}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'menu_finalized',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">5. Menu Finalized</p>
                            {lead.checklist.menu_finalized_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.menu_finalized_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.menu_finalized && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Step 6: Decoration Finalized */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.decoration_finalized}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'decoration_finalized',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">6. Decoration Finalized</p>
                            {lead.checklist.decoration_finalized_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.decoration_finalized_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.decoration_finalized && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Step 7: Full Payment */}
                      <div className="p-3 border-2 border-green-500/50 rounded-lg bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {lead.checklist.full_payment_completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">7. Full Payment</p>
                              {lead.checklist.full_payment_date && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(lead.checklist.full_payment_date).toLocaleDateString()} • 
                                  ₹{lead.checklist.full_payment_amount?.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {!lead.checklist.full_payment_completed && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Collect
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Collect Full Payment</DialogTitle>
                                  <DialogDescription>
                                    Record the full payment amount
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Full Payment Amount (₹)</Label>
                                    <Input
                                      type="number"
                                      value={fullPaymentAmount}
                                      onChange={(e) => setFullPaymentAmount(e.target.value)}
                                      placeholder="e.g., 200000"
                                    />
                                  </div>
                                  <Button onClick={handleFullPayment} className="w-full">
                                    Record Full Payment
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {/* Step 8: Post-Event Settlement */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.post_event_settlement}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'post_event_settlement',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">8. Post-Event Settlement</p>
                            {lead.checklist.post_event_settlement_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.post_event_settlement_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.post_event_settlement && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Step 9: Feedback */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={lead.checklist.feedback_collected}
                            onCheckedChange={(checked) =>
                              updateChecklistStep(
                                lead.checklist!.id,
                                'feedback_collected',
                                checked as boolean
                              )
                            }
                          />
                          <div>
                            <p className="font-medium">9. Feedback Collected</p>
                            {lead.checklist.feedback_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(lead.checklist.feedback_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.checklist.feedback_collected && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}

        {leads.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No leads found. Create a lead to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
