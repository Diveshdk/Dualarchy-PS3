'use client';

import { Booking } from '@/lib/types';

interface BookingsTableProps {
  bookings: Booking[];
  branchId: string;
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  // This component is now superseded by the inline table in bookings/page.tsx
  // Keeping it for backward compatibility
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {bookings.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Event Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hall</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-300">
                  {new Date(booking.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-slate-300">{booking.hall_name}</td>
                <td className="px-4 py-3 text-slate-200 font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={booking.balance_amount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    ₹{booking.balance_amount.toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-md capitalize ${
                    booking.status === 'confirmed' ? 'bg-violet-500/10 text-violet-400' :
                    booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-slate-500">No bookings found</div>
      )}
    </div>
  );
}
