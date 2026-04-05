import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
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
    <form onSubmit={submit} style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 24, background: 'rgba(9,8,12,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 0 }}>Book A Table</h3>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column' }}>
          Date
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDate(event.target.value)}
            style={{ marginTop: 8, width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit' }}
          />
        </label>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column' }}>
          Time
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            style={{ marginTop: 8, width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {slots.map((slot) => (
              <option key={slot.time} value={slot.time}>
                {slot.time}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column' }}>
          Guests
          <select
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            style={{ marginTop: 8, width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 24 }}>
        <p style={{ marginBottom: 8, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>Available Slots</p>
        <AvailabilitySlots slots={slots} selectedSlot={time} onSelect={setTime} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '12px 26px',
          background: submitting ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#c9a84c,#f0c96a)',
          border: 'none',
          borderRadius: 8,
          color: submitting ? '#2a2530' : '#060507',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'all .3s',
          boxShadow: submitting ? 'none' : '0 6px 24px rgba(201,168,76,0.25)',
        }}
      >
        {submitting ? 'Reserving...' : 'Reserve Now →'}
      </button>
    </form>
  );
}

export default BookingForm;
