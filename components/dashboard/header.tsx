'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Bell, ChevronDown, Building2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface HeaderProps {
  user: User;
  profile: Profile | null;
  branchName: string | null;
}

const roleColors: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  branch_manager: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  sales: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function DashboardHeader({ user, profile, branchName }: HeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const roleLabel = {
    owner: 'Owner',
    branch_manager: 'Branch Manager',
    sales: 'Sales',
  }[profile?.role ?? 'sales'];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Branch info */}
      <div className="flex items-center gap-3">
        {branchName && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Building2 className="w-4 h-4" />
            <span className="font-medium text-slate-200">{branchName}</span>
          </div>
        )}
      </div>

      {/* Right: User info + actions */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {profile?.role && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${roleColors[profile.role]}`}>
            {roleLabel}
          </span>
        )}

        {/* Notifications */}
        <button className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-200 leading-none">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
