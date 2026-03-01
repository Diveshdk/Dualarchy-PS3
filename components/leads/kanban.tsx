'use client';

import { Lead } from '@/lib/types';
import { LeadCard } from './lead-card';

interface LeadsKanbanProps {
  leads: Lead[];
  branchId: string;
}

export function LeadsKanban({ leads, branchId }: LeadsKanbanProps) {
  const columns = [
    { status: 'lead' as const, label: 'New Leads', color: 'bg-blue-500/20' },
    { status: 'qualified' as const, label: 'Qualified', color: 'bg-purple-500/20' },
    { status: 'converted' as const, label: 'Converted', color: 'bg-green-500/20' },
    { status: 'lost' as const, label: 'Lost', color: 'bg-red-500/20' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.status);

        return (
          <div key={column.status} className="bg-card border border-border rounded-lg p-4">
            {/* Column Header */}
            <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-border`}>
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-foreground text-sm">{column.label}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {columnLeads.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 min-h-[300px]">
              {columnLeads.length > 0 ? (
                columnLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} column={column.status} />
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
