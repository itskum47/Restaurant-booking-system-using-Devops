import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import use3DTilt from '../../hooks/use3DTilt';
import StarRating from '../ui/StarRating';
import StatusBadge from '../ui/StatusBadge';

function PriceDots({ level = 2 }) {
  return (
    <span className="text-xs tracking-[0.2em] text-[var(--accent-gold)]">
      {'●'.repeat(level)}
      <span className="text-[var(--text-muted)]">{'○'.repeat(Math.max(0, 4 - level))}</span>
    </span>
  );
}

function RestaurantCard({
  id,
  name,
  cuisine,
  rating,
  priceRange = 2,
  imageUrl,
  availableSlots = [],
  distance,
  variant = 'grid',
  description,
  vibe,
  location,
  why_recommended,
}) {
  const tiltRef = use3DTilt(8);
  const navigate = useNavigate();
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  const handleBookThis = () => {
    // Pass full restaurant data via navigation state
    navigate(`/restaurant/${encodeURIComponent(name)}`, {
      state: {
        restaurant: {
          id,
          name,
          cuisine,
          rating,
          priceRange,
          imageUrl,
          availableSlots,
          distance,
          description,
          vibe,
          location,
          why_recommended,
        }
      }
    });
  };

  return (
    <motion.article
      ref={tiltRef}
      className={`group relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all duration-500 ${
        isFeatured ? 'h-[420px] w-[300px] rounded-2xl' : isCompact ? 'rounded-xl p-5' : 'h-[390px] rounded-2xl'
      }`}
      whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.3)' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      {!isCompact && (
        <div className={`relative ${isFeatured ? 'h-full' : 'h-[55%]'} overflow-hidden`}>
          <img src={imageUrl} alt={name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[rgba(10,10,11,0.95)] to-transparent" />
          {isFeatured && (
            <StatusBadge variant="confirmed" className="absolute left-4 top-4">
              Available Tonight
            </StatusBadge>
          )}
        </div>
      )}

      <div className={`${isFeatured ? 'absolute inset-x-0 bottom-0 p-5' : isCompact ? '' : 'p-5'}`}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="font-[var(--font-display)] text-3xl leading-none tracking-tight">{name}</h3>
          {!isCompact && <StarRating rating={rating} />}
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          <span>{cuisine}</span>
          <span>·</span>
          <PriceDots level={priceRange} />
          {distance ? (
            <>
              <span>·</span>
              <span>{distance}</span>
            </>
          ) : null}
        </div>

        {!isCompact && (
          <div className="mb-5 flex flex-wrap gap-2">
            {availableSlots.slice(0, 3).map((slot) => (
              <span key={slot} className="rounded-full border border-[var(--border-gold)] px-3 py-1 text-[11px] text-[var(--accent-gold-light)]">
                {slot}
              </span>
            ))}
          </div>
        )}

        <motion.div
          initial={false}
          className={`${isCompact ? '' : 'translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'} transition-all duration-300`}
        >
          <button
            onClick={handleBookThis}
            className="inline-flex items-center gap-2 border border-[var(--border-gold)] bg-[var(--accent-gold-dim)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)] hover:text-[var(--bg-dark)] transition-colors"
          >
            Book This <span>→</span>
          </button>
        </motion.div>
      </div>
    </motion.article>
  );
}

export default RestaurantCard;
