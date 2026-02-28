'use client';

import { useState } from 'react';
import { createLead } from '@/lib/actions';
import { Lead, CreateLeadForm } from '@/lib/types';
import { Plus, X } from 'lucide-react';

interface NewLeadDialogProps {
  branchId: string;
  onLeadAdded: (lead: Lead) => void;
}

export function NewLeadDialog({ branchId, onLeadAdded }: NewLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateLeadForm>({
    branch_id: branchId,
    name: '',
    phone: '',
    event_date: '',
    guest_count: 0,
    estimated_budget: undefined,
    follow_up_date: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'guest_count' || name === 'estimated_budget')
        ? (value ? Number(value) : undefined)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createLead({ ...formData, guest_count: formData.guest_count || 0 });
    if (result.success && result.data) {
      onLeadAdded(result.data);
      setIsOpen(false);
      setFormData({ branch_id: branchId, name: '', phone: '', event_date: '', guest_count: 0 });
    } else {
      setError(result.error ?? 'Failed to create lead');
    }
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Lead
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add New Lead</h2>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Sharma"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 9876543210"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Date *</label>
                  <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Guest Count</label>
                  <input type="number" name="guest_count" value={formData.guest_count || ''} onChange={handleChange} min={0} placeholder="100"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Est. Budget (₹)</label>
                  <input type="number" name="estimated_budget" value={formData.estimated_budget || ''} onChange={handleChange} min={0} placeholder="500000"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Follow-up Date</label>
                  <input type="date" name="follow_up_date" value={formData.follow_up_date || ''} onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} placeholder="Additional notes..."
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl transition-all text-sm font-semibold disabled:opacity-60">
                  {isLoading ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
