import { createClient } from '@/lib/supabase/server';
import { DollarSign } from 'lucide-react';

interface RecentBookingsProps {
  branchId: string;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-violet-500/10 text-violet-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

export async function RecentBookings({ branchId }: RecentBookingsProps) {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`*, leads(name)`)
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        Recent Bookings
      </h3>

      {!bookings || bookings.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No bookings yet</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {(b.leads as { name: string } | null)?.name ?? 'Direct Booking'}
                </p>
                <p className="text-xs text-slate-500">
                  {b.hall_name} · {new Date(b.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-white">₹{b.total_amount.toLocaleString('en-IN')}</p>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusColors[b.status]}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
