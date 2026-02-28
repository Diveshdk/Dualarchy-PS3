'use client';

import { useEffect, useState } from 'react';
import { getEvents, getBranches, createEvent, updateEvent } from '@/lib/actions';
import { Event, MenuItem, Vendor, ChecklistItem } from '@/lib/types';
import { Utensils, ChefHat, Truck, CheckSquare, Plus, X, Check } from 'lucide-react';

type EventWithBooking = Event & {
  bookings?: {
    hall_name: string;
    event_date: string;
    guest_count: number;
    status: string;
    leads?: { name: string; phone: string } | null;
  };
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithBooking | null>(null);

  useEffect(() => {
    (async () => {
      const branchRes = await getBranches();
      if (branchRes.success && branchRes.data?.length) {
        const b = branchRes.data[0];
        const evRes = await getEvents(b.id);
        if (evRes.success && evRes.data) setEvents(evRes.data as EventWithBooking[]);
      }
      setLoading(false);
    })();
  }, []);

  const handleChecklistToggle = async (event: EventWithBooking, taskIdx: number) => {
    const newChecklist = (event.checklist || []).map((item, idx) =>
      idx === taskIdx ? { ...item, completed: !item.completed } : item
    );
    const res = await updateEvent(event.id, { checklist: newChecklist });
    if (res.success && res.data) {
      setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, checklist: newChecklist } : e));
      if (selectedEvent?.id === event.id) setSelectedEvent({ ...selectedEvent, checklist: newChecklist });
    }
  };

  if (loading) return <div className="p-8 text-slate-500 text-center">Loading events...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Events</h2>
        <p className="text-slate-400 text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''} · Manage menus, vendors & checklists</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No events yet. Events are auto-created from confirmed bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Event list */}
          <div className="space-y-3">
            {events.map((ev) => {
              const booking = ev.bookings as EventWithBooking['bookings'];
              const checklistDone = (ev.checklist || []).filter((c) => c.completed).length;
              const checklistTotal = (ev.checklist || []).length;

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedEvent?.id === ev.id ? 'border-violet-500' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {booking?.leads?.name ?? 'Direct Booking'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking?.hall_name} · {booking?.event_date ? new Date(booking.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${ev.finalized_at ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {ev.finalized_at ? 'Finalized' : 'Planning'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>🍽 {(ev.menu_items || []).length} menu items</span>
                    <span>🚚 {(ev.vendors || []).length} vendors</span>
                    {checklistTotal > 0 && (
                      <span className={checklistDone === checklistTotal ? 'text-emerald-400' : ''}>
                        ✓ {checklistDone}/{checklistTotal} tasks
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Event detail panel */}
          {selectedEvent && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-y-auto max-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200">Event Details</h3>
                <button onClick={() => setSelectedEvent(null)} className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Menu */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="w-4 h-4 text-violet-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Menu Items</p>
                </div>
                {(selectedEvent.menu_items || []).length === 0 ? (
                  <p className="text-xs text-slate-600">No menu items added</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedEvent.menu_items as MenuItem[]).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-800 rounded-lg px-3 py-2">
                        <span className="text-slate-300">{item.name}</span>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>×{item.quantity}</span>
                          <span className="text-emerald-400">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vendors */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Vendors</p>
                </div>
                {(selectedEvent.vendors || []).length === 0 ? (
                  <p className="text-xs text-slate-600">No vendors added</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedEvent.vendors as Vendor[]).map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-800 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-slate-300 font-medium">{v.name}</p>
                          <p className="text-slate-500">{v.type} · {v.phone}</p>
                        </div>
                        <span className="text-amber-400">₹{v.cost.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Checklist</p>
                </div>
                {(selectedEvent.checklist || []).length === 0 ? (
                  <p className="text-xs text-slate-600">No checklist items</p>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedEvent.checklist as ChecklistItem[]).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChecklistToggle(selectedEvent, idx)}
                        className="w-full flex items-center gap-3 text-xs bg-slate-800 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors text-left"
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-emerald-500' : 'border border-slate-600'}`}>
                          {item.completed && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}>{item.task}</span>
                        {item.assigned_to && <span className="ml-auto text-slate-600">{item.assigned_to}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
