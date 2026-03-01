import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { TopBar } from '@/components/dashboard/top-bar';
import { QuickReference } from '@/components/dashboard/quick-reference';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content - Fixed overflow */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <TopBar />
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
          <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Quick Reference */}
      <QuickReference />
    </div>
  );
}
