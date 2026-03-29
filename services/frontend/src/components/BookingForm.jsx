import { useState } from 'react';
import { bookingService } from '../services/api';

function BookingForm({ restaurant, onBookingConfirmed, onClose }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time_slot: '19:00',
    party_size: 2,
    special_requests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Generate user ID (in production, this would come from auth)
  const userId = 'user-' + Math.random().toString(36).substring(7);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        user_id: userId,
        restaurant_id: restaurant.id || restaurant._id || 'mock-restaurant-id',
        restaurant_name: restaurant.name,
        date: formData.date,
        time_slot: formData.time_slot,
        party_size: parseInt(formData.party_size),
        special_requests: formData.special_requests,
        ai_generated: false
      };

      const response = await bookingService.createBooking(bookingData);
      
      // Notify parent component
      onBookingConfirmed(response);

    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.detail || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate date options (next 14 days)
  const dateOptions = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dateOptions.push(date.toISOString().split('T')[0]);
  }

  // Time slot options
  const timeSlots = restaurant.available_slots || [
    '17:00', '17:30', '18:00', '18:30', '19:00', 
    '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  // Party size options
  const partySizeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Book your table
          </h2>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-primary-600">
              {restaurant.name}
            </h3>
            <p className="text-sm text-gray-600">
              {restaurant.cuisine} • {restaurant.city}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="mr-1">⭐</span>
              {restaurant.rating} • {restaurant.price_range}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <select
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="input-field"
          >
            {dateOptions.map(date => {
              const dateObj = new Date(date + 'T00:00:00');
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isToday = dateObj.getTime() === today.getTime();
              const isTomorrow = dateObj.getTime() === today.getTime() + 86400000;
              
              let label = dateObj.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              });
              
              if (isToday) label += ' (Today)';
              if (isTomorrow) label += ' (Tomorrow)';
              
              return (
                <option key={date} value={date}>{label}</option>
              );
            })}
          </select>
        </div>

        {/* Time Selection */}
        <div>
          <label htmlFor="time_slot" className="block text-sm font-medium text-gray-700 mb-2">
            Time *
          </label>
          <select
            id="time_slot"
            name="time_slot"
            value={formData.time_slot}
            onChange={handleChange}
            required
            className="input-field"
          >
            {timeSlots.map(slot => (
              <option key={slot} value={slot}>
                {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Party Size */}
        <div>
          <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-2">
            Party Size *
          </label>
          <select
            id="party_size"
            name="party_size"
            value={formData.party_size}
            onChange={handleChange}
            required
            className="input-field"
          >
            {partySizeOptions.map(size => (
              <option key={size} value={size}>
                {size} {size === 1 ? 'person' : 'people'}
              </option>
            ))}
          </select>
        </div>

        {/* Special Requests */}
        <div>
          <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            id="special_requests"
            name="special_requests"
            value={formData.special_requests}
            onChange={handleChange}
            rows={3}
            placeholder="E.g., dietary restrictions, seating preferences, celebration..."
            className="input-field resize-none"
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-900">
                {new Date(`2000-01-01T${formData.time_slot}`).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Party Size:</span>
              <span className="font-medium text-gray-900">
                {formData.party_size} {formData.party_size === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
