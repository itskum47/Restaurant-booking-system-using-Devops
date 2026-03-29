import { motion } from 'framer-motion';
import GhostButton from '../ui/GhostButton';

function BookingCard({ booking, onAction }) {
  const statusClass = booking.status === 'upcoming' ? 'upcoming' : booking.status === 'cancelled' ? 'cancelled' : 'past';

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[var(--border-gold)]"
    >
      <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[var(--accent-gold)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-[var(--font-display)] text-3xl leading-none">{booking.name}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            {booking.cuisine} · {booking.guests} guests
          </p>
        </div>
        <span className={`status-dot ${statusClass}`} />
      </div>

      <p className="text-sm text-[var(--text-secondary)]">{booking.date} · {booking.time}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{booking.meta}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {booking.status === 'upcoming' ? (
          <>
            <GhostButton onClick={() => onAction('modify', booking)}>Modify</GhostButton>
            <GhostButton onClick={() => onAction('cancel', booking)} className="border-[rgba(239,68,68,0.4)] text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.1)]">
              Cancel
            </GhostButton>
          </>
        ) : booking.status === 'past' ? (
          <>
            <GhostButton onClick={() => onAction('rebook', booking)}>Rebook ↺</GhostButton>
            <GhostButton onClick={() => onAction('review', booking)}>Leave Review</GhostButton>
          </>
        ) : (
          <GhostButton disabled className="opacity-60">
            Cancelled
          </GhostButton>
        )}
      </div>
    </motion.article>
  );
}

export default BookingCard;
