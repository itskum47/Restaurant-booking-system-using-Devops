import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo');

const CARD_STYLE = {
  style: {
    base: {
      color: '#F5F0E8',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#4A4845' },
      backgroundColor: 'transparent',
    },
    invalid: { color: '#EF4444' },
  },
};

function PaymentForm({ booking, onSuccess, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user, token, awardCredits, redeemCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [useCredits, setUseCredits] = useState(false);

  // Create payment intent on mount
  useEffect(() => {
    createPaymentIntent();
  }, [booking]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/v1/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_name: booking.restaurantName,
          date: booking.date,
          time: booking.time,
          party_size: booking.partySize,
          user_id: user?.id,
          guest_email: user?.email,
          guest_name: user?.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to create payment intent');
      const data = await response.json();
      setClientSecret(data.client_secret);
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Payment intent error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user?.name || 'Guest',
            email: user?.email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        onError?.(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment successful - confirm booking
        const confirmResponse = await fetch('/api/v1/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_intent_id: result.paymentIntent.id,
            restaurant_name: booking.restaurantName,
            cuisine: booking.cuisine || 'Cuisine',
            date: booking.date,
            time: booking.time,
            party_size: booking.partySize,
            guest_name: user?.name || 'Guest',
            guest_email: user?.email,
            user_id: user?.id,
            special_requests: booking.specialRequests,
          }),
        });

        if (!confirmResponse.ok) throw new Error('Failed to confirm booking');

        const bookingData = await confirmResponse.json();
        if (useCredits && (user?.dine_credits || 0) >= 100) {
          await redeemCredits('five-off');
        }
        await awardCredits('booking_completed');
        setLoading(false);
        onSuccess?.(bookingData);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      onError?.(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {/* Booking Summary */}
      <div style={{
        background: 'rgba(24, 24, 28, 0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#9A9490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Restaurant
          </div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#F5F0E8' }}>
            {booking.restaurantName}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ color: '#9A9490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Date
            </div>
            <div style={{ fontSize: '15px', color: '#F5F0E8' }}>
              {booking.date}
            </div>
          </div>
          <div>
            <div style={{ color: '#9A9490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Time
            </div>
            <div style={{ fontSize: '15px', color: '#F5F0E8' }}>
              {booking.time}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ color: '#9A9490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Guests
            </div>
            <div style={{ fontSize: '15px', color: '#F5F0E8' }}>
              {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
            </div>
          </div>
          <div>
            <div style={{ color: '#9A9490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Booking Fee
            </div>
            <div style={{ fontSize: '15px', color: '#C9A84C', fontWeight: 500 }}>
              $2.00
            </div>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(201,168,76,0.2)',
        background: 'rgba(201,168,76,0.05)',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useCredits}
            onChange={(e) => setUseCredits(e.target.checked)}
            disabled={(user?.dine_credits || 0) < 100}
          />
          <span style={{ color: '#F5F0E8', fontSize: '13px' }}>
            Use 100 credits for a $5 dining voucher ({user?.dine_credits || 0} available)
          </span>
        </label>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#9A9490',
          marginBottom: '8px',
        }}>
          Card Details
        </label>
        <div style={{
          padding: '12px 16px',
          background: '#0A0A0B',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
        }}>
          <CardElement options={CARD_STYLE} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#EF4444',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#F5F0E8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !clientSecret}
          style={{
            flex: 1,
            padding: '14px 16px',
            background: loading
              ? 'rgba(201, 168, 76, 0.3)'
              : 'linear-gradient(135deg, #C9A84C, #E8C97A)',
            border: 'none',
            borderRadius: '8px',
            color: loading ? '#4A4845' : '#0A0A0B',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.3s ease',
            boxShadow: !loading ? '0 4px 20px rgba(201,168,76,0.3)' : 'none',
          }}
        >
          {loading ? '⏳ Processing...' : 'Pay $2.00 & Book'}
        </button>
      </div>

      {/* Security Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: '#10B981',
      }}>
        🔒 Payments are securely processed by Stripe
      </div>
    </form>
  );
}

export default function PaymentModal({ booking, onSuccess, onError, onCancel, isOpen }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        paddingTop: '80px',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0A0A0B',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#F5F0E8',
          marginBottom: '8px',
          marginTop: 0,
        }}>
          Complete Your Booking
        </h2>
        <p style={{
          color: '#9A9490',
          fontSize: '14px',
          marginBottom: '24px',
          margin: '8px 0 24px',
        }}>
          Secure payment for your table reservation
        </p>

        <Elements stripe={stripePromise}>
          <PaymentForm
            booking={booking}
            onSuccess={onSuccess}
            onError={onError}
            onCancel={onCancel}
          />
        </Elements>
      </motion.div>
    </motion.div>
  );
}
