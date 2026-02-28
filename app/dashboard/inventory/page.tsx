'use client';

import { useEffect, useState } from 'react';
import { getInventory, getBranches, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/actions';
import { InventoryItem } from '@/lib/types';
import { Plus, Minus, Edit2, Trash2, X, AlertTriangle, Package } from 'lucide-react';

interface EditForm {
  item_name: string;
  quantity: number;
  threshold: number;
  unit: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<EditForm>({ item_name: '', quantity: 0, threshold: 10, unit: 'pcs' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const branchRes = await getBranches();
      if (branchRes.success && branchRes.data?.length) {
        const b = branchRes.data[0];
        setBranchId(b.id);
        const inv = await getInventory(b.id);
        if (inv.success && inv.data) setItems(inv.data);
      }
      setLoading(false);
    })();
  }, []);

  const lowStock = items.filter((i) => i.quantity <= i.threshold);

  const handleAddOrEdit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editItem) {
        const res = await updateInventoryItem(editItem.id, form);
        if (res.success && res.data) {
          setItems((prev) => prev.map((i) => i.id === editItem.id ? res.data! : i));
        } else setError(res.error);
      } else {
        const res = await createInventoryItem(branchId, form);
        if (res.success && res.data) {
          setItems((prev) => [...prev, res.data!]);
        } else setError(res.error);
      }
      if (!error) { setShowAdd(false); setEditItem(null); setForm({ item_name: '', quantity: 0, threshold: 10, unit: 'pcs' }); }
    } finally { setSaving(false); }
  };

  const handleQuickQty = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    const res = await updateInventoryItem(item.id, { quantity: newQty });
    if (res.success && res.data) setItems((prev) => prev.map((i) => i.id === item.id ? res.data! : i));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await deleteInventoryItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({ item_name: item.item_name, quantity: item.quantity, threshold: item.threshold, unit: item.unit || 'pcs' });
    setShowAdd(true);
  };

  if (loading) return <div className="p-8 text-slate-500 text-center">Loading inventory...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventory</h2>
          <p className="text-slate-400 text-sm mt-1">{items.length} items · {lowStock.length} low stock</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditItem(null); setForm({ item_name: '', quantity: 0, threshold: 10, unit: 'pcs' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{lowStock.length} item{lowStock.length > 1 ? 's' : ''}</span> below threshold: {lowStock.map((i) => i.item_name).join(', ')}
          </p>
        </div>
      )}

      {/* Inventory Grid */}
      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No inventory items yet. Add your first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const isLow = item.quantity <= item.threshold;
            return (
              <div key={item.id} className={`bg-slate-900 border rounded-xl p-4 transition-all ${isLow ? 'border-amber-500/30' : 'border-slate-800'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{item.item_name}</p>
                    <p className="text-xs text-slate-500">{item.unit}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(item)} className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Quantity progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isLow ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                      {isLow && '⚠ '}{item.quantity} {item.unit}
                    </span>
                    <span className="text-slate-600">min: {item.threshold}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-500' : 'bg-violet-500'}`}
                      style={{ width: `${Math.min(100, (item.quantity / (item.threshold * 3)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Quick adjust */}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleQuickQty(item, -1)} disabled={item.quantity === 0} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors disabled:opacity-30">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium text-slate-200">{item.quantity}</span>
                  <button onClick={() => handleQuickQty(item, 1)} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Item Name *</label>
                <input type="text" value={form.item_name} onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))} required
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Quantity</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))} min={0}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Min Stock</label>
                  <input type="number" value={form.threshold} onChange={(e) => setForm((p) => ({ ...p, threshold: Number(e.target.value) }))} min={0}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="pcs"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
              </div>
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleAddOrEdit} disabled={saving || !form.item_name} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all">
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
