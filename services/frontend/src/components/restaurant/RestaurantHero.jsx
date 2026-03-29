import { useEffect, useState } from 'react';
import StarRating from '../ui/StarRating';

function RestaurantHero({ restaurant }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(window.scrollY * 0.4);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative h-[50vh] overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
      <img
        src={restaurant.imageUrl}
        alt={restaurant.name}
        className="h-full w-full object-cover"
        style={{ transform: `translateY(${offset}px)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[rgba(10,10,11,0.55)] to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
        <div className="glass-card max-w-2xl rounded-2xl p-5 md:p-6">
          <h1 className="mb-2 font-[var(--font-display)] text-5xl font-light tracking-[-0.03em] md:text-6xl">{restaurant.name}</h1>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
            <StarRating rating={restaurant.rating} />
            <span>·</span>
            <span>{restaurant.cuisine}</span>
            <span>·</span>
            <span>{'$'.repeat(restaurant.priceRange)}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{restaurant.address}</p>
        </div>
      </div>
    </section>
  );
}

export default RestaurantHero;
