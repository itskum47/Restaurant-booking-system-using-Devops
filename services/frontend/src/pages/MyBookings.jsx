import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingCard from '../components/booking/BookingCard';
import GoldButton from '../components/ui/GoldButton';

function MyBookings() {
  const navigate = useNavigate();
  const bookings = useMemo(
    () => [
      {
        id: 1,
        status: 'upcoming',
        name: 'Nobu Malibu',
        cuisine: 'Japanese',
        guests: 2,
        date: 'Friday',
        time: '8:00 PM',
        meta: '3 days away',
      },
      {
        id: 2,
        status: 'past',
        name: 'Bestia',
        cuisine: 'Italian',
        guests: 4,
        date: 'Nov 24',
        time: '7:30 PM',
        meta: '★★★★★',
      },
      {
        id: 3,
        status: 'cancelled',
        name: 'Le Bernardin',
        cuisine: 'French',
        guests: 2,
        date: 'Nov 10',
        time: '9:00 PM',
        meta: 'Cancelled',
      },
    ],
    [],
  );

  const grouped = {
    upcoming: bookings.filter((booking) => booking.status === 'upcoming'),
    past: bookings.filter((booking) => booking.status === 'past'),
    cancelled: bookings.filter((booking) => booking.status === 'cancelled'),
  };

  const onAction = (action) => {
    if (action === 'rebook' || action === 'modify') {
      navigate('/chat');
    }
  };

  return (
    <section className="pb-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-[var(--font-display)] text-5xl">My Reservations</h1>
        <GoldButton onClick={() => navigate('/chat')}>+ New Booking</GoldButton>
      </div>

      <div className="relative space-y-8 pl-8">
        <div className="timeline-line" />

        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--accent-gold)]">Upcoming</h2>
          <div className="space-y-4">{grouped.upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} onAction={onAction} />)}</div>
        </div>

        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--accent-gold)]">Past</h2>
          <div className="space-y-4">{grouped.past.map((booking) => <BookingCard key={booking.id} booking={booking} onAction={onAction} />)}</div>
        </div>

        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--accent-gold)]">Cancelled</h2>
          <div className="space-y-4">{grouped.cancelled.map((booking) => <BookingCard key={booking.id} booking={booking} onAction={onAction} />)}</div>
        </div>
      </div>
    </section>
  );
}

export default MyBookings;
