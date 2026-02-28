'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Inbox,
  Package,
  Settings,
  Utensils,
  GitBranch,
  Star,
  Building2,
  TrendingUp,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface SidebarProps {
  role: UserRole;
}

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['owner', 'branch_manager', 'sales'] },
  { name: 'Leads', href: '/dashboard/leads', icon: Inbox, roles: ['owner', 'branch_manager', 'sales'] },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar, roles: ['owner', 'branch_manager', 'sales'] },
  { name: 'Events', href: '/dashboard/events', icon: Utensils, roles: ['owner', 'branch_manager'] },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['owner', 'branch_manager'] },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['owner', 'branch_manager'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['owner', 'branch_manager'] },
  { name: 'Branches', href: '/dashboard/settings?tab=branches', icon: GitBranch, roles: ['owner'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['owner', 'branch_manager', 'sales'] },
];

const roleConfig = {
  owner: { label: 'Owner', Icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  branch_manager: { label: 'Manager', Icon: Building2, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  sales: { label: 'Sales', Icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
};

export function DashboardSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const rc = roleConfig[role];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Banquet Pro</h1>
            <p className="text-xs text-slate-500">Event Management</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${rc.bg}`}>
          <rc.Icon className={`w-4 h-4 ${rc.color}`} />
          <span className={`text-xs font-medium ${rc.color}`}>{rc.label}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href.split('?')[0]));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 font-medium border border-violet-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">© 2026 Banquet Pro</p>
      </div>
    </aside>
  );
}
