import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import RestaurantHero from '../components/restaurant/RestaurantHero';
import BookingForm from '../components/booking/BookingForm';
import GhostButton from '../components/ui/GhostButton';

const mock = {
  id: 1,
  name: 'Nobu Malibu',
  rating: 4.9,
  cuisine: 'Japanese Fusion',
  priceRange: 4,
  address: '22706 Pacific Coast Hwy, Malibu',
  imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80',
  about:
    'An iconic destination where Japanese precision meets California coastline elegance. Signature omakase and oceanfront tables define every evening.',
  availableSlots: ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'],
};

function getContextualDishes(source) {
  const name = String(source?.name || '').toLowerCase();
  const c = String(source?.cuisine || '').toLowerCase();
  const addr = String(source?.location || source?.address || source?.description || source?.tag || '').toLowerCase();

  // Restaurant-specific dishes should win over cuisine fallback.
  if (name.includes('karim')) {
    return ['Mutton Korma', 'Chicken Jahangiri', 'Seekh Kebab', 'Sheermaal'];
  }
  if (name.includes('khau galli')) {
    return ['Pani Puri', 'Vada Pav', 'Pav Bhaji', 'Falooda Kulfi'];
  }
  if (name.includes('bukhara')) {
    return ['Dal Bukhara', 'Sikandari Raan', 'Tandoori Jhinga', 'Naan Bukhara'];
  }
  if (name.includes('indian accent')) {
    return ['Blue Cheese Naan', 'Meetha Achaar Pork Ribs', 'Dahi Kebab', 'Daulat Ki Chaat'];
  }
  
  if (c.includes('indian') || c.includes('mughlai') || c.includes('punjabi') || addr.includes('india') || addr.includes('delhi') || addr.includes('mumbai') || addr.includes('bangalore') || c.includes('street') || c.includes('chaat')) {
    if (c.includes('south')) return ['Masala Dosa', 'Idli Sambar', 'Medu Vada', 'Filter Coffee'];
    if (addr.includes('mumbai') || c.includes('street') || c.includes('truck')) return ['Vada Pav', 'Pav Bhaji', 'Pani Puri', 'Misal Pav'];
    return ['Butter Chicken', 'Dal Makhani', 'Garlic Naan', 'Biryani'];
  }
  
  if (c.includes('italian')) return ['Truffle Pasta', 'Margherita Pizza', 'Burrata', 'Tiramisu'];
  if (c.includes('french')) return ['Duck Confit', 'Beef Tartare', 'Escargot', 'Crème Brûlée'];
  if (c.includes('mexican')) return ['Tacos Al Pastor', 'Guacamole', 'Enchiladas', 'Churros'];
  if (c.includes('chinese')) return ['Peking Duck', 'Dim Sum', 'Lo Mein', 'Hot Pot'];
  if (c.includes('japanese') || c.includes('sushi')) return ['Black Cod Miso', 'Toro Tartare', 'Wagyu Skewer', 'Yuzu Cheesecake'];
  if (c.includes('thai')) return ['Pad Thai', 'Tom Yum Goong', 'Green Curry', 'Mango Sticky Rice'];
  if (c.includes('seafood')) return ['Grilled Salmon', 'Lobster Tail', 'Oysters', 'Clam Chowder'];
  if (c.includes('steak') || c.includes('american')) return ['Ribeye Steak', 'Truffle Fries', 'Bone-in Ribeye', 'Cheesecake'];
  
  return ['Chef\'s Tasting Platter', 'Seasonal Salad', 'House Special Catch', 'Signature Dessert'];
}

function getContextualImageUrl(source) {
  const cuisine = String(source?.cuisine || '').toLowerCase();

  const fallbackImages = {
    indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1600&q=80',
    chinese: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1600&q=80',
    japanese: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1600&q=80',
    italian: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80',
    seafood: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
    restaurant: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80',
  };

  const match = Object.keys(fallbackImages).find((key) => cuisine.includes(key));
  return fallbackImages[match || 'restaurant'];
}

function toDetailRestaurant(source, fallbackId) {
  if (!source) return { ...mock, id: fallbackId || mock.id };

  const priceText = String(source.price || source.price_range || '$$');
  const dollarCount = Math.max(1, Math.min(4, (priceText.match(/\$/g) || []).length || 2));
  const slots = Array.isArray(source.times)
    ? source.times.map((t) => (String(t).includes('PM') || String(t).includes('AM') ? String(t) : `${t} PM`))
    : mock.availableSlots;

  return {
    id: source.id || fallbackId || mock.id,
    name: source.name || mock.name,
    rating: Number(source.rating || mock.rating),
    cuisine: source.cuisine || mock.cuisine,
    priceRange: dollarCount,
    address: source.description || source.address || `${source.tag || 'Unknown area'}`,
    imageUrl: source.imageUrl || getContextualImageUrl(source),
    about: source.about || `${source.name || 'This place'} is a curated real-world recommendation${source.tag ? ` in ${source.tag}` : ''}.`,
    availableSlots: slots,
      signatureDishes: Array.isArray(source.signatureDishes) ? source.signatureDishes : (source.dishes || getContextualDishes(source)),
  };
}

function getCachedRestaurantById(id) {
  try {
    const raw = sessionStorage.getItem('restaurantCache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed[String(id)] || null;
  } catch {
    return null;
  }
}

function RestaurantDetail() {
  const location = useLocation();
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(mock);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fromNavigation = location.state?.restaurant;
    const fromCache = fromNavigation ? null : getCachedRestaurantById(id);
    setRestaurant(toDetailRestaurant(fromNavigation || fromCache, id));
  }, [id, location.state]);

  const tabs = useMemo(() => ['Overview', 'Menu', 'Photos', 'Reviews'], []);
  const menuItems = useMemo(
    () => (restaurant.signatureDishes || []).map((dish, index) => ({
      name: dish,
      price: `${restaurant.address?.toLowerCase().includes('india') ? '₹' : '$'}${(index + 2) * 80}`,
    })),
    [restaurant.signatureDishes, restaurant.address]
  );

  const photoGallery = useMemo(
    () => [
      restaurant.imageUrl,
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    ],
    [restaurant.imageUrl]
  );

  const reviews = useMemo(
    () => [
      {
        author: 'A. Sharma',
        rating: 5,
        text: `Excellent meal at ${restaurant.name}. Great flavors and warm service.`,
      },
      {
        author: 'R. Mehta',
        rating: 4,
        text: 'Loved the atmosphere and chef specials. Booking and seating were smooth.',
      },
      {
        author: 'P. Iyer',
        rating: 5,
        text: 'One of the best dining experiences in this area. Highly recommended.',
      },
    ],
    [restaurant.name]
  );

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/chat"
          style={{
            color: 'var(--gold-light)',
            textDecoration: 'none',
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 999,
            padding: '8px 14px',
          }}
        >
          ← Back
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton>♡</GhostButton>
          <GhostButton>Share</GhostButton>
        </div>
      </div>

      <RestaurantHero restaurant={restaurant} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <nav style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                position: 'relative',
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: activeTab === tab ? 'var(--gold-light)' : 'var(--muted)',
              }}
            >
              {tab}
              {activeTab === tab ? <span style={{ position: 'absolute', bottom: -10, left: 0, height: 2, width: '100%', background: 'var(--gold)' }} /> : null}
            </button>
          ))}
        </nav>

        {activeTab === 'Overview' ? (
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div
              style={{
                borderRadius: 16,
                padding: 20,
                background: 'rgba(15,12,19,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 34 }}>About</h3>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{restaurant.about}</p>
              <h4 style={{ margin: '28px 0 12px', fontFamily: 'var(--font-display)', fontSize: 28 }}>Chef&apos;s Signature</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {(restaurant.signatureDishes || []).map((dish) => (
                  <div
                    key={dish}
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      padding: 10,
                      fontSize: 13,
                    }}
                  >
                    {dish}
                  </div>
                ))}
              </div>
            </div>

            <BookingForm restaurant={restaurant} />
          </div>
        ) : null}

        {activeTab === 'Menu' ? (
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div
              style={{
                borderRadius: 16,
                padding: 20,
                background: 'rgba(15,12,19,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 34 }}>Menu</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {menuItems.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px 14px',
                      fontSize: 14,
                    }}
                  >
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--gold-light)' }}>{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <BookingForm restaurant={restaurant} />
          </div>
        ) : null}

        {activeTab === 'Photos' ? (
          <div
            style={{
              borderRadius: 16,
              padding: 20,
              background: 'rgba(15,12,19,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 34 }}>Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {photoGallery.map((photoUrl, index) => (
                <img
                  key={`${photoUrl}-${index}`}
                  src={photoUrl}
                  alt={`${restaurant.name} gallery ${index + 1}`}
                  style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'Reviews' ? (
          <div
            style={{
              borderRadius: 16,
              padding: 20,
              background: 'rgba(15,12,19,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 34 }}>Reviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((review) => (
                <div
                  key={review.author}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>{review.author}</strong>
                    <span style={{ color: 'var(--gold-light)' }}>{'★'.repeat(review.rating)}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RestaurantDetail;
