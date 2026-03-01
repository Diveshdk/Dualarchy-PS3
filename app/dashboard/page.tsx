'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboardStats, getBranches, getBookings } from '@/lib/server-actions';
import { StatCard } from '@/components/dashboard/stat-card';
import { Calendar, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadStats(selectedBranch);
      loadBookings(selectedBranch);
    }
  }, [selectedBranch]);

  async function loadData() {
    try {
      const branchesData = await getBranches();
      setBranches(branchesData || []);
      if (branchesData && branchesData.length > 0) {
        setSelectedBranch(branchesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(branchId: string) {
    try {
      const statsData = await getDashboardStats(branchId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadBookings(branchId: string) {
    try {
      const bookingsData = await getBookings(branchId);
      setBookings(bookingsData?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-8 p-6 md:p-8 bg-background min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your banquet business efficiently
          </p>
        </div>
        {branches.length > 0 && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
        >
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={Users}
            trend={12}
            color="blue"
            index={0}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={TrendingUp}
            trend={8}
            color="emerald"
            index={1}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`}
            icon={Calendar}
            trend={-2}
            color="amber"
            index={2}
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={AlertCircle}
            trend={0}
            color="rose"
            index={3}
          />
        </motion.div>
      )}

      {/* Recent Bookings */}
      <motion.div variants={itemVariants} className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">Recent Bookings</h2>
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                variants={itemVariants}
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{booking.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.event_date).toLocaleDateString()} • {booking.guest_count} guests
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">₹{booking.total_amount?.toLocaleString() || 0}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    booking.booking_status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : booking.booking_status === 'tentative'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {booking.booking_status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No bookings yet</p>
        )}
      </motion.div>
    </motion.div>
  );
}
