'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, Users, TrendingUp, MapPin, Phone, Mail, Crown, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BranchPaymentModal } from '@/components/payment/branch-payment-modal'
import { purchaseBranch, assignBranchManager } from '@/lib/production-actions'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
  capacity: number
  created_at: string
}

interface BranchStats {
  totalBookings: number
  totalRevenue: number
  conversionRate: number
  inventoryHealth: 'red' | 'green'
  hasManager: boolean
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchStats, setBranchStats] = useState<Record<string, BranchStats>>({})
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [managerEmail, setManagerEmail] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  
  // New branch form
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchCity, setBranchCity] = useState('')
  const [branchPhone, setBranchPhone] = useState('')
  const [branchCapacity, setBranchCapacity] = useState('500')
  
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load branches
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (branchesData) {
        setBranches(branchesData)
        
        // Load stats for each branch
        const statsPromises = branchesData.map(async (branch) => {
          // Get bookings count and revenue
          const { data: bookings } = await supabase
            .from('bookings')
            .select('total_cost, status')
            .eq('branch_id', branch.id)

          const totalBookings = bookings?.length || 0
          const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0

          // Get conversion rate
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branch.id)

          const { count: convertedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branch.id)
            .eq('status', 'won')

          const conversionRate = leadsCount ? Math.round((convertedCount || 0) / leadsCount * 100) : 0

          // Check inventory health
          const { data: supplies } = await supabase
            .from('food_supplies')
            .select('quantity, threshold')
            .eq('branch_id', branch.id)

          const hasLowStock = supplies?.some(s => s.quantity <= s.threshold) || false
          const inventoryHealth = hasLowStock ? 'red' as const : 'green' as const

          // Check if has manager
          const { data: manager } = await supabase
            .from('branch_managers')
            .select('id')
            .eq('branch_id', branch.id)
            .single()

          return {
            [branch.id]: {
              totalBookings,
              totalRevenue,
              conversionRate,
              inventoryHealth,
              hasManager: !!manager
            }
          }
        })

        const statsArray = await Promise.all(statsPromises)
        const statsObject = Object.assign({}, ...statsArray)
        setBranchStats(statsObject)
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const result = await purchaseBranch({
        ...paymentData,
        branchData: {
          name: branchName,
          address: branchAddress,
          city: branchCity,
          phone: branchPhone,
          capacity: parseInt(branchCapacity)
        }
      })

      if (result.success) {
        toast({
          title: 'Branch Purchased!',
          description: `${branchName} has been added successfully.`,
        })
        
        // Reset form
        setBranchName('')
        setBranchAddress('')
        setBranchCity('')
        setBranchPhone('')
        setBranchCapacity('500')
        
        // Reload branches
        await loadBranches()
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to purchase branch',
        variant: 'destructive'
      })
    }
  }

  const handleAssignManager = async () => {
    if (!selectedBranch || !managerEmail) return

    setIsAssigning(true)
    try {
      const result = await assignBranchManager(selectedBranch, managerEmail)

      if (result.success) {
        toast({
          title: 'Manager Assigned!',
          description: 'Branch manager has been notified.',
        })
        setShowManagerModal(false)
        setManagerEmail('')
        await loadBranches()
      } else {
        toast({
          title: 'Assignment Failed',
          description: result.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign manager',
        variant: 'destructive'
      })
    } finally {
      setIsAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground mt-1">
            Manage your banquet hall locations
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
              <DialogDescription>
                Enter branch details. Payment of ₹5,000 required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Mumbai Central"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={branchCity}
                  onChange={(e) => setBranchCity(e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              
              <div>
                <Label htmlFor="capacity">Guest Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={branchCapacity}
                  onChange={(e) => setBranchCapacity(e.target.value)}
                  placeholder="500"
                />
              </div>
              
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={!branchName}
                className="w-full"
                size="lg"
              >
                Proceed to Payment (₹5,000)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Branches</p>
              <p className="text-2xl font-bold">{branches.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                ₹{Object.values(branchStats).reduce((sum, stat) => sum + stat.totalRevenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">
                {Object.values(branchStats).reduce((sum, stat) => sum + stat.totalBookings, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold">
                {branches.length > 0 
                  ? Math.round(Object.values(branchStats).reduce((sum, stat) => sum + stat.conversionRate, 0) / branches.length)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch, index) => {
          const stats = branchStats[branch.id] || {
            totalBookings: 0,
            totalRevenue: 0,
            conversionRate: 0,
            inventoryHealth: 'green' as const,
            hasManager: false
          }

          return (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{branch.name}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
                        <MapPin className="w-4 h-4" />
                        {branch.city || 'Location'}
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${
                      stats.inventoryHealth === 'green' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {stats.inventoryHealth === 'green' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bookings</p>
                      <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">₹{(stats.totalRevenue / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-semibold">{stats.conversionRate}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${stats.conversionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{branch.phone || 'No phone'}</span>
                  </div>

                  {/* Manager Status */}
                  {stats.hasManager ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Manager Assigned</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedBranch(branch.id)
                        setShowManagerModal(true)
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign Manager
                    </Button>
                  )}

                  {/* Inventory Health */}
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    stats.inventoryHealth === 'green'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {stats.inventoryHealth === 'green' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {stats.inventoryHealth === 'green' ? 'Inventory Healthy' : 'Low Stock Alert'}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {branches.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Branches Yet</h3>
          <p className="text-muted-foreground mb-6">
            Purchase your first branch to get started with managing events
          </p>
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Add Your First Branch
          </Button>
        </Card>
      )}

      {/* Payment Modal */}
      <BranchPaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Assign Manager Modal */}
      <Dialog open={showManagerModal} onOpenChange={setShowManagerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Branch Manager</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to assign as manager
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="managerEmail">Manager Email</Label>
              <Input
                id="managerEmail"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@example.com"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowManagerModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignManager}
                disabled={!managerEmail || isAssigning}
                className="flex-1"
              >
                {isAssigning ? 'Assigning...' : 'Assign Manager'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
