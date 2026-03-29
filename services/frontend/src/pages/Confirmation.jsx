import { useLocation, useNavigate } from 'react-router-dom';
import BookingConfirmation from '../components/booking/BookingConfirmation';

function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const fallback = {
    booking: {
      restaurant_name: 'Nobu Malibu',
      date: 'Friday, December 8th',
      time_slot: '8:00 PM',
      party_size: 2,
    },
    bookingId: 'RB-2026-A7K9M2',
    email: 'user@example.com',
  };

  const data = location.state || fallback;

  return (
    <BookingConfirmation
      booking={data.booking}
      bookingId={data.bookingId}
      email={data.email}
      onViewBookings={() => navigate('/bookings')}
    />
  );
}

export default Confirmation;
