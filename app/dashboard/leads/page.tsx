'use client';

import { useEffect, useState } from 'react';
import { getLeads, getBranches } from '@/lib/actions';
import { Lead } from '@/lib/types';
import { LeadsKanban } from '@/components/leads/kanban';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const branchRes = await getBranches();
        if (branchRes.success && branchRes.data?.length) {
          const branch = branchRes.data[0];
          setBranchId(branch.id);
          const leadsRes = await getLeads(branch.id);
          if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leads Pipeline</h2>
          <p className="text-slate-400 text-sm mt-1">
            {leads.length} total leads · Drag through stages to books
          </p>
        </div>
        {branchId && <NewLeadDialog branchId={branchId} onLeadAdded={(l) => setLeads([l, ...leads])} />}
      </div>

      {branchId ? (
        <LeadsKanban leads={leads} branchId={branchId} />
      ) : (
        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <p className="text-slate-500">No branch assigned. Please contact your administrator.</p>
        </div>
      )}
    </div>
  );
}
