import { motion } from 'framer-motion';

function Star({ fill = 100 }) {
  return (
    <div style={{ position: 'relative', height: 16, width: 16, display: 'inline-block', flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0, height: 16, width: 16, color: 'rgba(255,255,255,0.12)' }} fill="currentColor">
        <path d="M12 2.5l2.95 6 6.62.96-4.79 4.68 1.13 6.6L12 17.64 6.09 20.74l1.13-6.6L2.43 9.46l6.62-.96L12 2.5z" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fill}%` }}>
        <svg viewBox="0 0 24 24" style={{ height: 16, width: 16, color: 'var(--accent-gold)' }} fill="currentColor">
          <path d="M12 2.5l2.95 6 6.62.96-4.79 4.68 1.13 6.6L12 17.64 6.09 20.74l1.13-6.6L2.43 9.46l6.62-.96L12 2.5z" />
        </svg>
      </div>
    </div>
  );
}

function StarRating({ rating = 0, max = 5, animate = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      {Array.from({ length: max }).map((_, index) => {
        const value = index + 1;
        const fill = rating >= value ? 100 : rating > index ? Math.round((rating - index) * 100) : 0;

        return (
          <motion.div
            key={value}
            initial={animate ? { opacity: 0, scale: 0.7 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : false}
            transition={animate ? { delay: index * 0.08, duration: 0.22 } : undefined}
            style={{ display: 'inline-block' }}
          >
            <Star fill={fill} />
          </motion.div>
        );
      })}
      <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default StarRating;
