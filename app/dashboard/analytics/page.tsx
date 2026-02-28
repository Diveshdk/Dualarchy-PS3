'use client';

import { useEffect, useState } from 'react';
import { getBranches, getRevenueData, getLeadFunnelData, getBookingStatusData, getBranchRevenueComparison } from '@/lib/actions';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { RevenueData, LeadFunnelData, BranchRevenueData } from '@/lib/types';

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function AnalyticsPage() {
  const [branchId, setBranchId] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [funnelData, setFunnelData] = useState<LeadFunnelData[]>([]);
  const [bookingStatus, setBookingStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [branchComparison, setBranchComparison] = useState<BranchRevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const branchRes = await getBranches();
      if (branchRes.success && branchRes.data?.length) {
        const b = branchRes.data[0];
        setBranchId(b.id);
        const ownerBranches = branchRes.data.length > 0;

        const [rev, funnel, status] = await Promise.all([
          getRevenueData(b.id),
          getLeadFunnelData(b.id),
          getBookingStatusData(b.id),
        ]);

        if (rev.success && rev.data) setRevenueData(rev.data);
        if (funnel.success && funnel.data) setFunnelData(funnel.data.filter((f) => f.count > 0));
        if (status.success && status.data) setBookingStatus(status.data.filter((s) => s.value > 0));

        // Try branch comparison (owner only)
        const comparison = await getBranchRevenueComparison();
        if (comparison.success && comparison.data) {
          setBranchComparison(comparison.data);
          if (comparison.data.length > 1) setIsOwner(true);
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-8 text-slate-500 text-center">Loading analytics...</div>;

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalGst = revenueData.reduce((s, d) => s + d.gst, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
        <p className="text-slate-400 text-sm mt-1">Business insights and metrics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '6-Month Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, color: 'text-violet-400' },
          { label: 'GST Collected', value: `₹${(totalGst / 100000).toFixed(1)}L`, color: 'text-emerald-400' },
          { label: 'Total Leads', value: funnelData.reduce((s, d) => s + d.count, 0).toString(), color: 'text-blue-400' },
          { label: 'Conversion Rate', value: (() => {
            const total = funnelData.reduce((s, d) => s + d.count, 0);
            const converted = funnelData.find((d) => d.status === 'advance_paid')?.count ?? 0;
            return total > 0 ? `${((converted / total) * 100).toFixed(1)}%` : '0%';
          })(), color: 'text-amber-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-5">Monthly Revenue (Last 6 Months)</h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name === 'revenue' ? 'Revenue' : 'GST']}
              />
              <Legend wrapperStyle={{ color: '#64748b', fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Revenue" />
              <Line type="monotone" dataKey="gst" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#22c55e', r: 3 }} name="GST" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No revenue data yet</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-5">Lead Pipeline Funnel</h3>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="label" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }}
                  formatter={(value: number) => [value, 'Leads']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No leads data yet</div>
          )}
        </div>

        {/* Booking Status Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-5">Bookings by Status</h3>
          {bookingStatus.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={bookingStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {bookingStatus.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {bookingStatus.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-slate-300">{s.name}</span>
                    <span className="ml-auto text-sm font-bold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No bookings yet</div>
          )}
        </div>
      </div>

      {/* Branch Comparison (owner only) */}
      {isOwner && branchComparison.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-5">Branch Revenue Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="branch" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name === 'revenue' ? 'Revenue' : 'Bookings']}
              />
              <Legend wrapperStyle={{ color: '#64748b', fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
