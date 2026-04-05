import { motion } from 'framer-motion';

function AvailabilitySlots({ slots = [], selectedSlot, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {slots.map((slot) => {
        const unavailable = slot.unavailable;
        const selected = selectedSlot === slot.time;

        const baseStyle = {
          borderRadius: '999px',
          border: '1px solid',
          padding: '8px 16px',
          fontSize: 12,
          letterSpacing: '0.08em',
          transition: 'all 300ms',
          cursor: unavailable ? 'not-allowed' : 'pointer',
          background: 'transparent',
          fontWeight: 500,
          textTransform: 'uppercase',
        };

        const style = unavailable
          ? {
              ...baseStyle,
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)',
              textDecoration: 'line-through',
              opacity: 0.5,
            }
          : selected
            ? {
                ...baseStyle,
                borderColor: 'var(--accent-gold)',
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-primary)',
              }
            : {
                ...baseStyle,
                borderColor: 'rgba(201,168,76,0.4)',
                color: 'var(--accent-gold)',
              };

        return (
          <motion.button
            key={slot.time}
            type="button"
            disabled={unavailable}
            onClick={() => onSelect(slot.time)}
            whileTap={{ scale: unavailable ? 1 : 0.96 }}
            style={style}
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
