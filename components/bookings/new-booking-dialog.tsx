'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/actions';
import { Booking, CreateBookingForm } from '@/lib/types';
import { Plus } from 'lucide-react';

interface NewBookingDialogProps {
  branchId: string;
  onBookingAdded: (booking: Booking) => void;
}

export function NewBookingDialog({ branchId, onBookingAdded }: NewBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBookingForm>({
    branch_id: branchId,
    client_name: '',
    client_email: '',
    client_phone: '',
    event_date: '',
    event_time: '',
    hall_type: '',
    guest_count: 0,
    advance_amount: 0,
    total_amount: undefined,
    notes: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'guest_count' || name === 'advance_amount' || name === 'total_amount'
          ? value
            ? parseFloat(value)
            : 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createBooking(formData);
      if (result.success && result.data) {
        onBookingAdded(result.data);
        setFormData({
          branch_id: branchId,
          client_name: '',
          client_email: '',
          client_phone: '',
          event_date: '',
          event_time: '',
          hall_type: '',
          guest_count: 0,
          advance_amount: 0,
          total_amount: undefined,
          notes: '',
        });
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        New Booking
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Create New Booking</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Event Time */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Event Time</label>
                <input
                  type="time"
                  name="event_time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Hall Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hall Type</label>
                <select
                  name="hall_type"
                  value={formData.hall_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a hall</option>
                  <option value="banquet-hall">Banquet Hall</option>
                  <option value="conference-room">Conference Room</option>
                  <option value="garden">Garden</option>
                  <option value="terrace">Terrace</option>
                </select>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Guest Count *
                </label>
                <input
                  type="number"
                  name="guest_count"
                  value={formData.guest_count}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="100"
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="50000"
                />
              </div>

              {/* Advance Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Advance Amount (₹)
                </label>
                <input
                  type="number"
                  name="advance_amount"
                  value={formData.advance_amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Any special requirements..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
