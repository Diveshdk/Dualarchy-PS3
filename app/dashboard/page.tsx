import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/components/dashboard/stats';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, branches(name)')
    .eq('id', user.id)
    .single();

  // Get the appropriate branch id for stats
  let branchId: string | null = profile?.branch_id ?? null;

  if (profile?.role === 'owner') {
    const { data: branches } = await supabase
      .from('branches')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);
    branchId = branches?.[0]?.id ?? null;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {greeting}, {name} 👋
          </h2>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      {branchId && (
        <DashboardStats branchId={branchId} />
      )}

      {!branchId && profile?.role === 'owner' && (
        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-3">You haven&apos;t created a branch yet.</p>
          <a
            href="/dashboard/settings?tab=branches"
            className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create your first branch
          </a>
        </div>
      )}

      {/* Main grid */}
      {branchId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingEvents branchId={branchId} />
          <RecentBookings branchId={branchId} />
        </div>
      )}
    </div>
  );
}
