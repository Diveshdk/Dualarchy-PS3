import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/actions';
import { TrendingUp, Calendar, DollarSign, AlertCircle, FileText, Package, Bell } from 'lucide-react';

interface DashboardStatsProps {
  branchId: string;
}

export async function DashboardStats({ branchId }: DashboardStatsProps) {
  const { data: stats } = await getDashboardStats(branchId);

  const cards = [
    {
      label: 'Total Leads',
      value: stats?.totalLeads ?? 0,
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: 'Confirmed Bookings',
      value: stats?.totalBookings ?? 0,
      icon: Calendar,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      border: 'border-violet-400/20',
    },
    {
      label: 'Total Revenue',
      value: `₹${((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      label: 'Pending Invoices',
      value: stats?.pendingInvoices ?? 0,
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
    {
      label: 'Upcoming Events',
      value: stats?.upcomingEvents ?? 0,
      icon: Calendar,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
    },
    {
      label: 'Low Stock Items',
      value: stats?.lowStockItems ?? 0,
      icon: Package,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
    },
  ];

  return (
    <>
      {/* Overdue follow-up banner */}
      {(stats?.overdueFollowUps ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Bell className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{stats!.overdueFollowUps} lead{stats!.overdueFollowUps > 1 ? 's' : ''}</span> have overdue follow-up dates. Check your leads pipeline.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-slate-900 border ${card.border} rounded-xl p-5 hover:border-opacity-60 transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
