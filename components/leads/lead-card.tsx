'use client';

import { Lead, LeadStatus } from '@/lib/types';
import { User, Calendar, Users, DollarSign } from 'lucide-react';
import { updateLeadStatus, convertLeadToBooking } from '@/lib/actions';
import { useState } from 'react';

interface LeadCardProps {
  lead: Lead;
  column: LeadStatus;
}

export function LeadCard({ lead, column }: LeadCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdating(true);
    try {
      await updateLeadStatus(lead.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConvert = async () => {
    setIsUpdating(true);
    try {
      await convertLeadToBooking(lead.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-secondary/40 border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors">
      {/* Client Name */}
      <div className="flex items-start gap-2 mb-3">
        <User className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground text-sm">{lead.client_name}</p>
          <p className="text-xs text-muted-foreground">{lead.client_email}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-xs">
        {lead.event_date && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(lead.event_date)}</span>
          </div>
        )}
        {lead.guest_count && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{lead.guest_count} guests</span>
          </div>
        )}
        {lead.advance_amount > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span>₹{lead.advance_amount}</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
          {lead.status}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-3 border-t border-border">
        {column === 'lead' && (
          <button
            onClick={() => handleStatusChange('qualified')}
            disabled={isUpdating}
            className="w-full px-2 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition-colors disabled:opacity-50"
          >
            Qualify
          </button>
        )}
        {(column === 'qualified' || column === 'lead') && (
          <button
            onClick={handleConvert}
            disabled={isUpdating}
            className="w-full px-2 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50"
          >
            Convert to Booking
          </button>
        )}
        {column !== 'lost' && (
          <button
            onClick={() => handleStatusChange('lost')}
            disabled={isUpdating}
            className="w-full px-2 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors disabled:opacity-50"
          >
            Lost
          </button>
        )}
      </div>
    </div>
  );
}
