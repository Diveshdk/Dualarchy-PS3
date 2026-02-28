'use client';

import { Lead } from '@/lib/types';
import { Phone, Calendar, Users, DollarSign, AlertCircle, ArrowRight, X, Clock } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isMoving: boolean;
  onMoveForward: () => void;
  onMarkLost: () => void;
  showMoveForward: boolean;
  showMarkLost: boolean;
}

export function LeadCard({
  lead,
  isMoving,
  onMoveForward,
  onMarkLost,
  showMoveForward,
  showMarkLost,
}: LeadCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const isFollowUpOverdue =
    lead.follow_up_date && lead.follow_up_date < today && lead.status !== 'lost' && lead.status !== 'advance_paid';
  const isFollowUpToday = lead.follow_up_date === today;

  return (
    <div className={`bg-slate-900 border border-slate-700/60 rounded-lg p-3 transition-all ${isMoving ? 'opacity-50 scale-95' : 'hover:border-slate-600'}`}>
      {/* Name */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <p className="text-sm font-semibold text-slate-100 leading-tight truncate">{lead.name}</p>
        {isFollowUpOverdue && (
          <span title="Overdue follow-up">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Phone className="w-3 h-3" />
          <span>{lead.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{new Date(lead.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2">
          {lead.guest_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users className="w-3 h-3" />
              <span>{lead.guest_count.toLocaleString()}</span>
            </div>
          )}
          {lead.estimated_budget && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <DollarSign className="w-3 h-3" />
              <span>₹{(lead.estimated_budget / 1000).toFixed(0)}K</span>
            </div>
          )}
        </div>

        {/* Follow-up */}
        {lead.follow_up_date && (
          <div className={`flex items-center gap-1 text-xs rounded px-1.5 py-0.5 w-fit ${
            isFollowUpOverdue
              ? 'bg-red-500/10 text-red-400'
              : isFollowUpToday
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-slate-800 text-slate-500'
          }`}>
            <Clock className="w-3 h-3" />
            <span>
              {isFollowUpOverdue ? 'Overdue: ' : isFollowUpToday ? 'Today: ' : ''}
              {new Date(lead.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {(showMoveForward || showMarkLost) && (
        <div className="flex gap-1.5 mt-3 pt-2 border-t border-slate-800">
          {showMoveForward && (
            <button
              onClick={onMoveForward}
              disabled={isMoving}
              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded-md transition-colors disabled:opacity-50"
            >
              <ArrowRight className="w-3 h-3" />
              Advance
            </button>
          )}
          {showMarkLost && (
            <button
              onClick={onMarkLost}
              disabled={isMoving}
              className="px-2 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors disabled:opacity-50"
              title="Mark as Lost"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
