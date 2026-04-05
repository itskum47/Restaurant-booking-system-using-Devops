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
    <section
      style={{
        position: 'relative',
        height: '52vh',
        minHeight: 320,
        maxHeight: 620,
        overflow: 'hidden',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0f0c13',
      }}
    >
      <img
        src={restaurant.imageUrl}
        alt={restaurant.name}
        style={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          transform: `translateY(${offset}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(6,5,7,0.95), rgba(10,10,11,0.55), rgba(10,10,11,0.15))',
        }}
      />

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24 }}>
        <div
          style={{
            maxWidth: 760,
            borderRadius: 16,
            padding: 18,
            background: 'rgba(9,8,12,0.62)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 500, letterSpacing: '-0.02em' }}>{restaurant.name}</h1>
          <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)' }}>
            <StarRating rating={restaurant.rating} />
            <span>·</span>
            <span>{restaurant.cuisine}</span>
            <span>·</span>
            <span>{(restaurant.address && restaurant.address.toLowerCase().includes('india') ? '₹' : '$').repeat(restaurant.priceRange)}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{restaurant.address}</p>
        </div>
      </div>
    </section>
  );
}

export default RestaurantHero;
