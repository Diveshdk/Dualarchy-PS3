'use client';

import { useEffect, useState } from 'react';
import { getBookings, getBranches, updateBookingStatus } from '@/lib/actions';
import { Booking, Branch } from '@/lib/types';
import { NewBookingDialog } from '@/components/bookings/new-booking-dialog';
import { Calendar, Users, CheckCircle, XCircle, DollarSign, ChevronDown } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const branchRes = await getBranches();
        if (branchRes.success && branchRes.data?.length) {
          const b = branchRes.data[0];
          setBranch(b);
          const bookingsRes = await getBookings(b.id);
          if (bookingsRes.success && bookingsRes.data) setBookings(bookingsRes.data);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
    const result = await updateBookingStatus(bookingId, status);
    if (result.success && result.data) {
      setBookings((prev) => prev.map((b) => b.id === bookingId ? result.data! : b));
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) {
    return <div className="p-8 text-slate-500 text-sm text-center">Loading bookings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bookings</h2>
          <p className="text-slate-400 text-sm mt-1">{bookings.length} total · Manage hall reservations</p>
        </div>
        {branch && <NewBookingDialog branchId={branch.id} onBookingAdded={(b) => setBookings([b, ...bookings])} />}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <p className="text-slate-500">No bookings found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hall</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Guests</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium">
                      {new Date(b.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{b.hall_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      {b.guest_count}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium">₹{b.total_amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-emerald-400">₹{b.advance_amount.toLocaleString('en-IN')} paid</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-medium ${b.balance_amount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₹{b.balance_amount.toLocaleString('en-IN')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-md border capitalize ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'confirmed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(b.id, 'completed')}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Mark Completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(b.id, 'cancelled')}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
