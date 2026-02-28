'use client';

import { useState } from 'react';
import { Lead } from '@/lib/types';
import { convertLeadToBooking } from '@/lib/actions';
import { X, Building2, DollarSign, AlertCircle } from 'lucide-react';

interface ConvertBookingDialogProps {
  lead: Lead;
  onConverted: (updatedLead: Lead) => void;
  onClose: () => void;
}

export function ConvertBookingDialog({ lead, onConverted, onClose }: ConvertBookingDialogProps) {
  const [hallName, setHallName] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(lead.estimated_budget || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallName.trim()) { setError('Hall name is required'); return; }
    if (totalAmount <= 0) { setError('Total amount must be greater than 0'); return; }

    setIsLoading(true);
    setError(null);

    const result = await convertLeadToBooking(lead.id, hallName, advanceAmount, totalAmount);

    if (result.success) {
      onConverted({ ...lead, status: 'advance_paid' });
    } else {
      setError(result.error ?? 'Failed to convert booking');
    }
    setIsLoading(false);
  };

  const balance = totalAmount * 1.18 - advanceAmount;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Convert to Booking</h2>
            <p className="text-sm text-slate-400 mt-0.5">{lead.name} · {new Date(lead.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Hall / Venue Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={hallName}
                onChange={(e) => setHallName(e.target.value)}
                required
                placeholder="e.g. Grand Ballroom"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Amount (₹)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                min={0}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Advance Paid (₹)</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                min={0}
                max={totalAmount}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-slate-200">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">GST (18%)</span>
              <span className="text-slate-200">₹{(totalAmount * 0.18).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2">
              <span className="text-white">Total incl. GST</span>
              <span className="text-white">₹{(totalAmount * 1.18).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Advance</span>
              <span className="text-emerald-400">- ₹{advanceAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2">
              <span className="text-amber-400">Balance Due</span>
              <span className="text-amber-400">₹{Math.max(0, balance).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all text-sm font-semibold disabled:opacity-60"
            >
              {isLoading ? 'Converting...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
