import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

interface RecentBookingsProps {
  branchId: string;
}

export async function RecentBookings({ branchId }: RecentBookingsProps) {
  const supabase = await createClient();

  // Fetch recent bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, client_name, advance_amount, total_amount, created_at')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .limit(5);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₹0';
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Bookings</h3>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {bookings && bookings.length > 0 ? (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{booking.client_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(booking.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground text-sm">
                  {formatCurrency(booking.total_amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Advance: {formatCurrency(booking.advance_amount)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">No recent bookings</p>
        )}
      </div>
    </div>
  );
}
