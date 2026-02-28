'use client';

import { useEffect, useState } from 'react';
import { getInvoices, getBranches, updateInvoiceStatus } from '@/lib/actions';
import { Invoice } from '@/lib/types';
import { FileText, CheckCircle, DollarSign, AlertCircle } from 'lucide-react';

type InvoiceWithBooking = Invoice & {
  bookings?: {
    hall_name: string;
    event_date: string;
    guest_count: number;
    leads?: { name: string; phone: string } | null;
  };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithBooking[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const branchRes = await getBranches();
      if (branchRes.success && branchRes.data?.length) {
        const b = branchRes.data[0];
        const res = await getInvoices(b.id);
        if (res.success && res.data) setInvoices(res.data as InvoiceWithBooking[]);
      }
      setLoading(false);
    })();
  }, []);

  const handleMarkPaid = async (invoice: InvoiceWithBooking) => {
    const res = await updateInvoiceStatus(invoice.id, 'paid', invoice.total);
    if (res.success && res.data) {
      setInvoices((prev) => prev.map((inv) => inv.id === invoice.id ? { ...inv, ...res.data!, status: 'paid' } : inv));
    }
  };

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  const totalOutstanding = invoices
    .filter((i) => i.status === 'pending')
    .reduce((s, i) => s + (i.balance_due || 0), 0);

  if (loading) return <div className="p-8 text-slate-500 text-center">Loading invoices...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Invoices</h2>
        <p className="text-slate-400 text-sm mt-1">{invoices.length} total invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-white">{invoices.length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-400">{invoices.filter((i) => i.status === 'paid').length}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-amber-400">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div key={inv.id} className={`bg-slate-900 border rounded-xl p-4 transition-all ${inv.status === 'pending' ? 'border-amber-500/20' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-medium text-violet-400">{inv.invoice_number || 'Pending...'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {inv.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">
                    {(inv.bookings as any)?.leads?.name ?? 'Direct Booking'} — {(inv.bookings as any)?.hall_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(inv.bookings as any)?.event_date ? new Date((inv.bookings as any).event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-white">₹{inv.total.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-500">Incl. GST ₹{inv.gst.toLocaleString('en-IN')}</p>
                  {inv.balance_due > 0 && (
                    <p className="text-xs text-amber-400 mt-1">Balance: ₹{inv.balance_due.toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Details row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Subtotal: ₹{inv.subtotal.toLocaleString('en-IN')}</span>
                  <span>Advance: ₹{inv.advance_paid.toLocaleString('en-IN')}</span>
                  <span>GST: ₹{inv.gst.toLocaleString('en-IN')}</span>
                </div>
                {inv.status === 'pending' && (
                  <button
                    onClick={() => handleMarkPaid(inv)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors font-medium"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
