import { motion } from 'framer-motion';

function Star({ fill = 100 }) {
  return (
    <div className="relative h-4 w-4">
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-4 w-4 text-[rgba(255,255,255,0.12)]" fill="currentColor">
        <path d="M12 2.5l2.95 6 6.62.96-4.79 4.68 1.13 6.6L12 17.64 6.09 20.74l1.13-6.6L2.43 9.46l6.62-.96L12 2.5z" />
      </svg>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--accent-gold)]" fill="currentColor">
          <path d="M12 2.5l2.95 6 6.62.96-4.79 4.68 1.13 6.6L12 17.64 6.09 20.74l1.13-6.6L2.43 9.46l6.62-.96L12 2.5z" />
        </svg>
      </div>
    </div>
  );
}

function StarRating({ rating = 0, max = 5, animate = true }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const value = index + 1;
        const fill = rating >= value ? 100 : rating > index ? Math.round((rating - index) * 100) : 0;

        return (
          <motion.div
            key={value}
            initial={animate ? { opacity: 0, scale: 0.7 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : false}
            transition={animate ? { delay: index * 0.08, duration: 0.22 } : undefined}
          >
            <Star fill={fill} />
          </motion.div>
        );
      })}
      <span className="ml-1 text-xs text-[var(--text-secondary)]">{rating.toFixed(1)}</span>
    </div>
  );
}

export default StarRating;
