'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Package, Users, Store, TrendingUp, AlertTriangle, Plus } from 'lucide-react'

interface Supply {
  id: string
  item_name: string
  category: string
  quantity: number
  unit: string
  threshold: number
  supplier_name: string
}

interface Vendor {
  id: string
  vendor_name: string
  vendor_type: string
  contact_person: string
  phone: string
  email: string
  rating: number
}

interface SalesExec {
  id: string
  email: string
  full_name: string
  created_at: string
}

interface Lead {
  id: string
  company_name: string
  contact_name: string
  status: string
  estimated_budget: number
  sales_name: string
}

interface Stats {
  totalSupplies: number
  lowStockItems: number
  totalVendors: number
  totalSales: number
  totalLeads: number
  conversionRate: number
}

export default function BranchManagerPortal() {
  const [branchId, setBranchId] = useState<string>('')
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [salesTeam, setSalesTeam] = useState<SalesExec[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSupplies: 0,
    lowStockItems: 0,
    totalVendors: 0,
    totalSales: 0,
    totalLeads: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  // Form states
  const [newSupply, setNewSupply] = useState({
    item_name: '',
    category: 'appetizers',
    quantity: 0,
    unit: 'kg',
    threshold: 10,
    supplier_name: ''
  })

  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    vendor_type: 'catering',
    contact_person: '',
    phone: '',
    email: ''
  })

  const [newSalesEmail, setNewSalesEmail] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get manager's branch
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', user.id)
      .single()

    if (!profile?.branch_id) {
      toast({
        title: 'No Branch Assigned',
        description: 'You are not assigned to any branch yet.',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    setBranchId(profile.branch_id)

    // Load supplies
    const { data: suppliesData } = await supabase
      .from('food_supplies')
      .select('*')
      .eq('branch_id', profile.branch_id)

    // Load vendors
    const { data: vendorsData } = await supabase
      .from('vendors')
      .select('*')
      .eq('branch_id', profile.branch_id)

    // Load sales team - SIMPLE QUERY
    const { data: salesExecData } = await supabase
      .from('sales_executives')
      .select('id, email, created_at, sales_id')
      .eq('branch_id', profile.branch_id)

    // Get names for sales
    let salesWithNames: SalesExec[] = []
    if (salesExecData && salesExecData.length > 0) {
      const salesIds = salesExecData.map(s => s.sales_id)
      const { data: salesProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', salesIds)

      salesWithNames = salesExecData.map(s => ({
        id: s.id,
        email: s.email,
        created_at: s.created_at,
        full_name: salesProfiles?.find(p => p.id === s.sales_id)?.full_name || 'Unknown'
      }))
    }

    // Load leads - SIMPLE QUERY
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, status, estimated_budget, sales_id')
      .eq('branch_id', profile.branch_id)

    // Get sales names for leads
    let leadsWithNames: Lead[] = []
    if (leadsData && leadsData.length > 0) {
      const leadSalesIds = [...new Set(leadsData.map(l => l.sales_id))]
      const { data: leadSalesProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', leadSalesIds)

      leadsWithNames = leadsData.map(l => ({
        id: l.id,
        company_name: l.company_name,
        contact_name: l.contact_name,
        status: l.status,
        estimated_budget: l.estimated_budget || 0,
        sales_name: leadSalesProfiles?.find(p => p.id === l.sales_id)?.full_name || 'Unknown'
      }))
    }

    setSupplies(suppliesData || [])
    setVendors(vendorsData || [])
    setSalesTeam(salesWithNames)
    setLeads(leadsWithNames)

    // Calculate stats
    const lowStock = suppliesData?.filter(s => s.quantity <= s.threshold).length || 0
    const wonLeads = leadsData?.filter(l => l.status === 'won').length || 0
    const totalLeads = leadsData?.length || 0
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

    setStats({
      totalSupplies: suppliesData?.length || 0,
      lowStockItems: lowStock,
      totalVendors: vendorsData?.length || 0,
      totalSales: salesWithNames.length,
      totalLeads: totalLeads,
      conversionRate: Math.round(conversionRate)
    })

    setLoading(false)
  }

  const addSupply = async () => {
    if (!newSupply.item_name || !branchId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('food_supplies')
      .insert([{
        branch_id: branchId,
        item_name: newSupply.item_name,
        category: newSupply.category,
        quantity: newSupply.quantity,
        unit: newSupply.unit,
        threshold: newSupply.threshold,
        supplier_name: newSupply.supplier_name,
        created_by: user.id
      }])

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Supply Added',
      description: `${newSupply.item_name} has been added to inventory.`
    })

    setNewSupply({
      item_name: '',
      category: 'appetizers',
      quantity: 0,
      unit: 'kg',
      threshold: 10,
      supplier_name: ''
    })

    loadDashboardData()
  }

  const addVendor = async () => {
    if (!newVendor.vendor_name || !newVendor.phone || !branchId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('vendors')
      .insert([{
        branch_id: branchId,
        vendor_name: newVendor.vendor_name,
        vendor_type: newVendor.vendor_type,
        contact_person: newVendor.contact_person,
        phone: newVendor.phone,
        email: newVendor.email,
        created_by: user.id
      }])

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Vendor Added',
      description: `${newVendor.vendor_name} has been added.`
    })

    setNewVendor({
      vendor_name: '',
      vendor_type: 'catering',
      contact_person: '',
      phone: '',
      email: ''
    })

    loadDashboardData()
  }

  const addSalesExecutive = async () => {
    if (!newSalesEmail || !branchId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find user by email
    const { data: salesUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newSalesEmail)
      .single()

    if (!salesUser) {
      toast({
        title: 'User Not Found',
        description: 'No user found with that email.',
        variant: 'destructive'
      })
      return
    }

    // Add to sales_executives
    const { error } = await supabase
      .from('sales_executives')
      .insert([{
        branch_id: branchId,
        sales_id: salesUser.id,
        assigned_by: user.id,
        email: newSalesEmail
      }])

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    // Update user role
    await supabase
      .from('profiles')
      .update({ role: 'sales' })
      .eq('id', salesUser.id)

    toast({
      title: 'Sales Executive Added',
      description: `${newSalesEmail} has been added to your team.`
    })

    setNewSalesEmail('')
    loadDashboardData()
  }

  const updateSupplyQuantity = async (supplyId: string, newQuantity: number) => {
    const { error } = await supabase
      .from('food_supplies')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', supplyId)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Quantity Updated',
      description: 'Supply quantity has been updated.'
    })

    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Branch Manager Portal</h1>
        <p className="text-muted-foreground">Manage supplies, vendors, and sales team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Supplies</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSupplies}</div>
              {stats.lowStockItems > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {stats.lowStockItems} Low Stock
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVendors}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats.totalLeads} Total Leads</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="supplies" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="supplies">Supplies</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="sales">Sales Team</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        {/* SUPPLIES TAB */}
        <TabsContent value="supplies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Food Supplies</CardTitle>
                  <CardDescription>Monitor inventory levels</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supply
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Supply</DialogTitle>
                      <DialogDescription>Add a new item to inventory</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Item Name</Label>
                        <Input
                          value={newSupply.item_name}
                          onChange={(e) => setNewSupply({ ...newSupply, item_name: e.target.value })}
                          placeholder="e.g., Basmati Rice"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={newSupply.category} onValueChange={(v) => setNewSupply({ ...newSupply, category: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appetizers">Appetizers</SelectItem>
                            <SelectItem value="main_course">Main Course</SelectItem>
                            <SelectItem value="desserts">Desserts</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="snacks">Snacks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={newSupply.quantity}
                            onChange={(e) => setNewSupply({ ...newSupply, quantity: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input
                            value={newSupply.unit}
                            onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
                            placeholder="kg, pcs, liters"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Alert Threshold</Label>
                        <Input
                          type="number"
                          value={newSupply.threshold}
                          onChange={(e) => setNewSupply({ ...newSupply, threshold: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Supplier Name</Label>
                        <Input
                          value={newSupply.supplier_name}
                          onChange={(e) => setNewSupply({ ...newSupply, supplier_name: e.target.value })}
                        />
                      </div>
                      <Button onClick={addSupply} className="w-full">Add Supply</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {stats.lowStockItems > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Low Stock Alert</p>
                    <p className="text-sm text-red-700">{stats.lowStockItems} items need restocking</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {supplies.map((supply) => {
                  const isLowStock = supply.quantity <= supply.threshold
                  return (
                    <motion.div
                      key={supply.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 border rounded-lg ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{supply.item_name}</h3>
                            <Badge variant={isLowStock ? 'destructive' : 'default'}>
                              {supply.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supplier: {supply.supplier_name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-24"
                              defaultValue={supply.quantity}
                              onBlur={(e) => {
                                const newQty = parseFloat(e.target.value)
                                if (newQty !== supply.quantity) {
                                  updateSupplyQuantity(supply.id, newQty)
                                }
                              }}
                            />
                            <span className="text-sm font-medium">{supply.unit}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Threshold: {supply.threshold} {supply.unit}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {supplies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No supplies added yet. Click "Add Supply" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VENDORS TAB */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendors</CardTitle>
                  <CardDescription>Manage your vendor list</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Vendor</DialogTitle>
                      <DialogDescription>Add a vendor to your list</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Vendor Name</Label>
                        <Input
                          value={newVendor.vendor_name}
                          onChange={(e) => setNewVendor({ ...newVendor, vendor_name: e.target.value })}
                          placeholder="e.g., Elite Catering Services"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={newVendor.vendor_type} onValueChange={(v) => setNewVendor({ ...newVendor, vendor_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="catering">Catering</SelectItem>
                            <SelectItem value="decoration">Decoration</SelectItem>
                            <SelectItem value="photography">Photography</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Contact Person</Label>
                        <Input
                          value={newVendor.contact_person}
                          onChange={(e) => setNewVendor({ ...newVendor, contact_person: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={newVendor.phone}
                          onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newVendor.email}
                          onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                        />
                      </div>
                      <Button onClick={addVendor} className="w-full">Add Vendor</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors.map((vendor) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{vendor.vendor_name}</CardTitle>
                          <Badge>{vendor.vendor_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {vendor.contact_person && (
                            <p><span className="font-medium">Contact:</span> {vendor.contact_person}</p>
                          )}
                          <p><span className="font-medium">Phone:</span> {vendor.phone}</p>
                          {vendor.email && (
                            <p><span className="font-medium">Email:</span> {vendor.email}</p>
                          )}
                          {vendor.rating && (
                            <p><span className="font-medium">Rating:</span> {vendor.rating}/5 ⭐</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {vendors.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No vendors added yet. Click "Add Vendor" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALES TEAM TAB */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Team</CardTitle>
                  <CardDescription>Manage your sales executives</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sales Executive
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Sales Executive</DialogTitle>
                      <DialogDescription>Add a sales executive by email</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          value={newSalesEmail}
                          onChange={(e) => setNewSalesEmail(e.target.value)}
                          placeholder="sales@example.com"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          User must already have an account
                        </p>
                      </div>
                      <Button onClick={addSalesExecutive} className="w-full">Add to Team</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesTeam.map((sales) => (
                  <motion.div
                    key={sales.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{sales.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{sales.email}</p>
                      </div>
                      <Badge variant="outline">
                        Added {new Date(sales.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </motion.div>
                ))}

                {salesTeam.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sales executives added yet. Click "Add Sales Executive" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADS TAB */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>All Branch Leads</CardTitle>
              <CardDescription>View leads from all sales executives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{lead.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sales: {lead.sales_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            lead.status === 'won' ? 'default' :
                            lead.status === 'lost' ? 'destructive' :
                            'outline'
                          }
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
                  </motion.div>
                ))}

                {leads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No leads yet. Sales executives will create leads.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
