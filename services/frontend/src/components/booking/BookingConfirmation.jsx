import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GoldButton from '../ui/GoldButton';
import GhostButton from '../ui/GhostButton';

function launchConfetti() {
  for (let i = 0; i < 50; i += 1) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: ${2 + Math.random() * 4}px;
      height: ${8 + Math.random() * 12}px;
      background: ${Math.random() > 0.5 ? '#C9A84C' : '#E8C97A'};
      left: ${20 + Math.random() * 60}%;
      top: 60%;
      border-radius: 2px;
      pointer-events: none;
      z-index: 9999;
      animation: confetti ${1 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards;
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 3000);
  }
}

function BookingConfirmation({ booking, bookingId, email, onViewBookings }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    launchConfetti();
  }, []);

  const copyId = async () => {
    await navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.1),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--border-gold)] bg-[rgba(24,24,28,0.82)] p-8 shadow-[var(--shadow-deep)]"
      >
        <h1 className="mb-6 text-center font-[var(--font-display)] text-5xl font-light">
          <span className="hero-decorator">✦</span> Reservation Confirmed <span className="hero-decorator">✦</span>
        </h1>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] p-6">
          <h2 className="mb-4 text-center font-[var(--font-display)] text-4xl">◆ {booking.restaurant_name} ◆</h2>
          <p className="text-center text-sm text-[var(--text-secondary)]">
            {booking.date} · {booking.time_slot} · Table for {booking.party_size}
          </p>
          <hr className="gold-divider my-5" />

          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">Booking ID</p>
            <button
              type="button"
              onClick={copyId}
              className="mt-2 font-[var(--font-mono)] text-xl text-[var(--accent-gold)]"
              title="Click to copy"
            >
              {bookingId}
            </button>
            {copied ? <p className="mt-1 text-xs text-[var(--accent-green)]">Copied</p> : null}
          </div>

          <hr className="gold-divider my-5" />

          <p className="text-center text-sm text-[var(--text-secondary)]">Confirmation sent to {email}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
          <GhostButton onClick={() => window.alert('Calendar integration hook ready.')}>Add to Calendar</GhostButton>
          <GoldButton onClick={onViewBookings}>View My Bookings</GoldButton>
        </div>
      </motion.div>
    </section>
  );
}

export default BookingConfirmation;
