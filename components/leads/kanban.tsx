'use client';

import { useState } from 'react';
import { Lead, LeadStatus } from '@/lib/types';
import { LeadCard } from './lead-card';
import { updateLeadStatus } from '@/lib/actions';
import { ConvertBookingDialog } from './convert-booking-dialog';

interface LeadsKanbanProps {
  leads: Lead[];
  branchId: string;
  canConvert?: boolean;
}

const COLUMNS: { status: LeadStatus; label: string; color: string; border: string; dot: string }[] = [
  { status: 'new', label: 'New', color: 'bg-slate-500/10', border: 'border-slate-600/30', dot: 'bg-slate-400' },
  { status: 'contacted', label: 'Contacted', color: 'bg-blue-500/10', border: 'border-blue-600/30', dot: 'bg-blue-400' },
  { status: 'visit', label: 'Site Visit', color: 'bg-indigo-500/10', border: 'border-indigo-600/30', dot: 'bg-indigo-400' },
  { status: 'tasting', label: 'Tasting', color: 'bg-purple-500/10', border: 'border-purple-600/30', dot: 'bg-purple-400' },
  { status: 'negotiation', label: 'Negotiation', color: 'bg-amber-500/10', border: 'border-amber-600/30', dot: 'bg-amber-400' },
  { status: 'advance_paid', label: 'Advance Paid', color: 'bg-emerald-500/10', border: 'border-emerald-600/30', dot: 'bg-emerald-400' },
  { status: 'lost', label: 'Lost', color: 'bg-red-500/10', border: 'border-red-600/30', dot: 'bg-red-400' },
];

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'visit', 'tasting', 'negotiation', 'advance_paid', 'lost'];

export function LeadsKanban({ leads: initialLeads, branchId, canConvert = true }: LeadsKanbanProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleMoveForward = async (lead: Lead) => {
    const currentIdx = STATUS_ORDER.indexOf(lead.status);
    if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 2) return; // -2 to skip 'lost'
    const nextStatus = STATUS_ORDER[currentIdx + 1];

    if (nextStatus === 'advance_paid' && canConvert) {
      setConvertLead(lead);
      return;
    }

    setMovingId(lead.id);
    const result = await updateLeadStatus(lead.id, nextStatus);
    if (result.success && result.data) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? result.data! : l)));
    }
    setMovingId(null);
  };

  const handleMarkLost = async (lead: Lead) => {
    setMovingId(lead.id);
    const result = await updateLeadStatus(lead.id, 'lost');
    if (result.success && result.data) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? result.data! : l)));
    }
    setMovingId(null);
  };

  const handleConverted = (updatedLead: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setConvertLead(null);
  };

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.status);
            return (
              <div key={col.status} className={`w-64 rounded-xl border ${col.border} ${col.color} flex flex-col`}>
                {/* Column Header */}
                <div className="flex items-center gap-2 p-3 border-b border-white/5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-medium text-slate-200">{col.label}</span>
                  <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 min-h-[300px] max-h-[600px] overflow-y-auto">
                  {colLeads.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs py-8">No leads</div>
                  ) : (
                    colLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isMoving={movingId === lead.id}
                        onMoveForward={() => handleMoveForward(lead)}
                        onMarkLost={() => handleMarkLost(lead)}
                        showMoveForward={lead.status !== 'advance_paid' && lead.status !== 'lost'}
                        showMarkLost={lead.status !== 'lost' && lead.status !== 'advance_paid'}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {convertLead && (
        <ConvertBookingDialog
          lead={convertLead}
          onConverted={handleConverted}
          onClose={() => setConvertLead(null)}
        />
      )}
    </>
  );
}
