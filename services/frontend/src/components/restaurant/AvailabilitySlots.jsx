import { motion } from 'framer-motion';

function AvailabilitySlots({ slots = [], selectedSlot, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const unavailable = slot.unavailable;
        const selected = selectedSlot === slot.time;

        return (
          <motion.button
            key={slot.time}
            type="button"
            disabled={unavailable}
            onClick={() => onSelect(slot.time)}
            whileTap={{ scale: unavailable ? 1 : 0.96 }}
            className={`rounded-full border px-4 py-2 text-xs tracking-[0.08em] transition-all duration-300 ${
              unavailable
                ? 'cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-muted)] line-through opacity-50'
                : selected
                  ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-primary)]'
                  : 'border-[var(--border-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold-dim)]'
            }`}
            animate={selected ? { scale: [1, 1.08, 1.02] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            {slot.time}
          </motion.button>
        );
      })}
    </div>
  );
}

export default AvailabilitySlots;
