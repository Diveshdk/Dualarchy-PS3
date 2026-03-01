import { createClient } from '@/lib/supabase/server';
import { TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  branchId: string;
}

export async function DashboardStats({ branchId }: DashboardStatsProps) {
  const supabase = await createClient();

  // Fetch statistics
  const [
    { count: totalLeads },
    { count: totalBookings },
    { data: invoices },
    { count: lowStockCount },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('booking_status', 'confirmed'),
    supabase
      .from('invoices')
      .select('total_amount')
      .eq('branch_id', branchId)
      .eq('payment_status', 'paid'),
    supabase
      .from('inventory')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .filter('quantity_available', 'lte', 10),
  ]);

  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  const stats = [
    {
      label: 'Total Leads',
      value: totalLeads || 0,
      icon: Trending Up,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Confirmed Bookings',
      value: totalBookings || 0,
      icon: Calendar,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Total Revenue',
      value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'Low Stock Items',
      value: lowStockCount || 0,
      icon: AlertCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
