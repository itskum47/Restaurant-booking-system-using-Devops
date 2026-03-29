import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import GoldButton from '../ui/GoldButton';
import AvailabilitySlots from '../restaurant/AvailabilitySlots';

function BookingForm({ restaurant, defaultSlot = '8:00 PM' }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(defaultSlot);
  const [partySize, setPartySize] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const slots = useMemo(
    () =>
      (restaurant?.availableSlots || ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM']).map((item) => ({
        time: item,
        unavailable: false,
      })),
    [restaurant],
  );

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        user_id: 'concierge-user-001',
        party_size: partySize,
        date,
        time_slot: time,
        special_requests: 'Window seating if possible',
      };

      const result = await bookingService.createBooking(payload);

      navigate('/confirmation', {
        state: {
          booking: result?.booking || payload,
          bookingId: result?.booking_id || `RB-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          email: 'user@example.com',
          restaurant,
        },
      });
    } catch {
      navigate('/confirmation', {
        state: {
          booking: {
            restaurant_name: restaurant.name,
            date,
            time_slot: time,
            party_size: partySize,
          },
          bookingId: `RB-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          email: 'user@example.com',
          restaurant,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl border border-[var(--border-subtle)] p-6">
      <h3 className="mb-5 font-[var(--font-display)] text-4xl">Book A Table</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm text-[var(--text-secondary)]">
          Date
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
          />
        </label>

        <label className="text-sm text-[var(--text-secondary)]">
          Time
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
          >
            {slots.map((slot) => (
              <option key={slot.time} value={slot.time}>
                {slot.time}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-[var(--text-secondary)]">
          Guests
          <select
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs uppercase tracking-[0.1em] text-[var(--text-secondary)]">Available Slots</p>
        <AvailabilitySlots slots={slots} selectedSlot={time} onSelect={setTime} />
      </div>

      <GoldButton type="submit" className="mt-6 w-full" disabled={submitting}>
        {submitting ? 'Reserving...' : 'Reserve Now →'}
      </GoldButton>
    </form>
  );
}

export default BookingForm;
