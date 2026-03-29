import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(mock);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    setRestaurant((prev) => ({ ...prev, id: Number(id) || prev.id }));
  }, [id]);

  const tabs = useMemo(() => ['Overview', 'Menu', 'Photos', 'Reviews'], []);

  return (
    <section className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Link to="/chat" className="nav-link text-sm uppercase tracking-[0.12em]">
          ← Back
        </Link>
        <div className="flex gap-2">
          <GhostButton>♡</GhostButton>
          <GhostButton>Share</GhostButton>
        </div>
      </div>

      <RestaurantHero restaurant={restaurant} />

      <div className="space-y-6">
        <nav className="relative flex flex-wrap gap-6 border-b border-[var(--border-subtle)] pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative text-sm uppercase tracking-[0.12em] transition-colors ${activeTab === tab ? 'text-[var(--accent-gold)]' : 'text-[var(--text-secondary)]'}`}
            >
              {tab}
              {activeTab === tab ? <span className="absolute -bottom-3 left-0 h-[2px] w-full bg-[var(--accent-gold)]" /> : null}
            </button>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl">
            <h3 className="mb-3 font-[var(--font-display)] text-3xl">About</h3>
            <p className="text-[var(--text-secondary)]">{restaurant.about}</p>
            <h4 className="mt-8 mb-3 font-[var(--font-display)] text-2xl">Chef&apos;s Signature</h4>
            <div className="grid grid-cols-2 gap-3">
              {['Black Cod Miso', 'Toro Tartare', 'Wagyu Skewer', 'Yuzu Cheesecake'].map((dish) => (
                <div key={dish} className="rounded-lg border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] p-3 text-sm">
                  {dish}
                </div>
              ))}
            </div>
          </div>

          <BookingForm restaurant={restaurant} />
        </div>
      </div>
    </section>
  );
}

export default RestaurantDetail;
