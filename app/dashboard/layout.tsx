import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get branch name if assigned
  let branchName: string | null = null;
  if (profile?.branch_id) {
    const { data: branch } = await supabase
      .from('branches')
      .select('name')
      .eq('id', profile.branch_id)
      .single();
    branchName = branch?.name ?? null;
  }

  // Owner: get first branch for default context
  let defaultBranchId: string | null = profile?.branch_id ?? null;
  if (profile?.role === 'owner' && !defaultBranchId) {
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('owner_id', user.id)
      .limit(1);
    if (branches?.[0]) {
      defaultBranchId = branches[0].id;
      branchName = branches[0].name;
    }
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <DashboardSidebar role={profile?.role ?? 'sales'} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader
          user={user}
          profile={profile}
          branchName={branchName}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
