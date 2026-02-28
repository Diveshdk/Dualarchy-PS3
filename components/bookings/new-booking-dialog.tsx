'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/actions';
import { Booking } from '@/lib/types';
import { Plus, X, Building2, AlertCircle } from 'lucide-react';

interface NewBookingDialogProps {
  branchId: string;
  onBookingAdded: (booking: Booking) => void;
}

export function NewBookingDialog({ branchId, onBookingAdded }: NewBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    hall_name: '',
    event_date: '',
    guest_count: '',
    advance_amount: '',
    total_amount: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createBooking({
      branch_id: branchId,
      hall_name: form.hall_name,
      event_date: form.event_date,
      guest_count: Number(form.guest_count) || 0,
      advance_amount: Number(form.advance_amount) || 0,
      total_amount: Number(form.total_amount) || 0,
    });

    if (result.success && result.data) {
      onBookingAdded(result.data);
      setIsOpen(false);
      setForm({ hall_name: '', event_date: '', guest_count: '', advance_amount: '', total_amount: '' });
    } else {
      setError(result.error ?? 'Failed to create booking');
    }
    setIsLoading(false);
  };

  const total = Number(form.total_amount) || 0;
  const advance = Number(form.advance_amount) || 0;
  const balance = total * 1.18 - advance;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Booking
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">New Booking</h2>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Hall / Venue *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="hall_name" value={form.hall_name} onChange={handleChange} required placeholder="Grand Ballroom"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Date *</label>
                  <input type="date" name="event_date" value={form.event_date} onChange={handleChange} required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Guest Count</label>
                  <input type="number" name="guest_count" value={form.guest_count} onChange={handleChange} min={0} placeholder="100"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Amount (₹)</label>
                  <input type="number" name="total_amount" value={form.total_amount} onChange={handleChange} min={0} placeholder="500000"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Advance (₹)</label>
                  <input type="number" name="advance_amount" value={form.advance_amount} onChange={handleChange} min={0}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
              </div>
              {total > 0 && (
                <div className="bg-slate-800 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span>₹{(total*0.18).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-1.5"><span>Total incl. GST</span><span>₹{(total*1.18).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-amber-400"><span>Balance Due</span><span>₹{Math.max(0, balance).toLocaleString('en-IN')}</span></div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all">
                  {isLoading ? 'Booking...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
