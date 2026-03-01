import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';

interface UpcomingEventsProps {
  branchId: string;
}

export async function UpcomingEvents({ branchId }: UpcomingEventsProps) {
  const supabase = await createClient();

  // Fetch upcoming bookings
  const today = new Date().toISOString().split('T')[0];
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, client_name, event_date, guest_count, booking_status')
    .eq('branch_id', branchId)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(5);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Upcoming Events</h3>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {bookings && bookings.length > 0 ? (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{booking.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.guest_count} guests • {formatDate(booking.event_date)}
                </p>
              </div>
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                {booking.booking_status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">No upcoming events</p>
        )}
      </div>
    </div>
  );
}
