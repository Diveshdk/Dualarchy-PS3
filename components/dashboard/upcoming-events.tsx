import { createClient } from '@/lib/supabase/server';
import { Calendar, Users, Clock } from 'lucide-react';

interface UpcomingEventsProps {
  branchId: string;
}

export async function UpcomingEvents({ branchId }: UpcomingEventsProps) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`*, leads(name, phone)`)
    .eq('branch_id', branchId)
    .eq('status', 'confirmed')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-violet-400" />
        Upcoming Events
      </h3>

      {!bookings || bookings.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No upcoming events</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const daysUntil = Math.ceil(
              (new Date(b.event_date).getTime() - new Date().getTime()) / 86400000
            );
            return (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs text-violet-400 font-bold leading-none">
                    {new Date(b.event_date).toLocaleDateString('en-IN', { day: '2-digit' })}
                  </span>
                  <span className="text-xs text-violet-500 uppercase leading-none">
                    {new Date(b.event_date).toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {(b.leads as { name: string } | null)?.name ?? 'Direct Booking'}
                  </p>
                  <p className="text-xs text-slate-500">{b.hall_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    {b.guest_count}
                  </div>
                  <p className={`text-xs font-medium ${daysUntil <= 3 ? 'text-red-400' : daysUntil <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
