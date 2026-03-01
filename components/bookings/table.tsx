'use client';

import { Booking } from '@/lib/types';
import { Calendar, Users, DollarSign } from 'lucide-react';

interface BookingsTableProps {
  bookings: Booking[];
  branchId: string;
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₹0';
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'tentative':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/40 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Event Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Advance
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">{booking.client_name}</td>
                  <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {formatDate(booking.event_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {booking.guest_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    {formatCurrency(booking.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {booking.advance_amount > 0 ? (
                      <span className="text-green-400">
                        {formatCurrency(booking.advance_amount)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        booking.booking_status
                      )}`}
                    >
                      {booking.booking_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">No bookings found</div>
      )}
    </div>
  );
}
