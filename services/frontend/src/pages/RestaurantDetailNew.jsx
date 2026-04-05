import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PaymentModal from '../components/booking/PaymentModal';
import { useAuth } from '../context/AuthContext';

// Michelin star data — mapped by cuisine/restaurant name
const getMichelinStars = (name, cuisine) => {
  const starMap = {
    'Carbone': { stars: 1, rating: 4.8, awards: ['Michelin Star 2023', 'James Beard Nominee'] },
    'Osteria Mozza': { stars: 1, rating: 4.7, awards: ['Michelin Star 2022'] },
    'Bella Vita': { stars: 2, rating: 4.9, awards: ['Michelin Star 2023', 'Wine Spectator Award'] },
    'Le Bernardin': { stars: 3, rating: 5.0, awards: ['3 Michelin Stars', 'World\'s 50 Best'] },
    'Nobu': { stars: 1, rating: 4.8, awards: ['Michelin Star', 'Forbes 5-Star'] },
  };
  // Fallback based on cuisine
  const cuisineStars = {
    'Italian': { stars: 1, rating: 4.7, awards: ['Michelin Recommended'] },
    'Japanese': { stars: 2, rating: 4.8, awards: ['Michelin Star 2023'] },
    'French': { stars: 2, rating: 4.9, awards: ['Michelin Star 2022', 'Michelin Star 2023'] },
    'Italian-American': { stars: 1, rating: 4.6, awards: ['Michelin Bib Gourmand'] },
  };
  return starMap[name] || cuisineStars[cuisine] || { stars: 1, rating: 4.5, awards: ['Michelin Recommended'] };
};

function getRestaurantProfile(name) {
  const n = String(name || '').toLowerCase();

  if (n.includes('karim')) {
    return {
      highlights: [
        { name: 'Mutton Korma', description: 'Slow-cooked old Delhi style mutton curry with whole spices', price: '₹520', tag: "Chef's Signature" },
        { name: 'Chicken Jahangiri', description: 'Rich Mughlai gravy, smoked chicken, saffron finish', price: '₹490', tag: 'Most Popular' },
        { name: 'Seekh Kebab', description: 'Minced lamb kebabs, charcoal grilled, mint chutney', price: '₹340', tag: 'Must Try' },
      ],
      fullMenu: {
        starters: [
          { name: 'Mutton Seekh Kebab', description: 'Charcoal grilled minced mutton skewers', price: '₹340', popular: true },
          { name: 'Shami Kebab', description: 'Pan-seared spiced mince patties', price: '₹320', popular: false },
          { name: 'Chicken Malai Tikka', description: 'Cream-marinated boneless chicken from tandoor', price: '₹380', popular: true },
          { name: 'Khameeri Roti Bites', description: 'Traditional fermented bread with chutney trio', price: '₹180', popular: false },
        ],
        mains: [
          { name: 'Mutton Korma', description: 'Signature slow-cooked Mughlai mutton curry', price: '₹520', popular: true },
          { name: 'Chicken Jahangiri', description: 'Royal style chicken curry, saffron and cream', price: '₹490', popular: true },
          { name: 'Nihari', description: 'Overnight braised mutton shank, spice-infused gravy', price: '₹560', popular: false },
          { name: 'Mutton Biryani', description: 'Fragrant basmati layered with tender mutton', price: '₹620', popular: true },
        ],
        desserts: [
          { name: 'Shahi Tukda', description: 'Fried bread in rabri, nuts and saffron', price: '₹220', popular: true },
          { name: 'Kheer', description: 'Slow-cooked rice pudding, green cardamom', price: '₹180', popular: false },
          { name: 'Phirni', description: 'Ground rice pudding set in earthen pot', price: '₹190', popular: false },
        ],
        drinks: [
          { name: 'Masala Chaas', description: 'Spiced buttermilk with roasted cumin', price: '₹110', popular: true },
          { name: 'Kesar Lassi', description: 'Sweet yogurt drink with saffron and pistachio', price: '₹160', popular: false },
          { name: 'Nimbu Pani', description: 'Fresh lime, mint, black salt cooler', price: '₹100', popular: false },
        ],
      },
    };
  }

  if (n.includes('khau galli')) {
    return {
      highlights: [
        { name: 'Pani Puri', description: 'Crispy golgappa shells, spicy mint water, sweet chutney', price: '₹120', tag: "Chef's Signature" },
        { name: 'Vada Pav', description: 'Mumbai potato fritter slider, garlic chutney', price: '₹90', tag: 'Most Popular' },
        { name: 'Pav Bhaji', description: 'Buttery toasted pav with spiced mashed vegetables', price: '₹180', tag: 'Must Try' },
      ],
      fullMenu: {
        starters: [
          { name: 'Pani Puri', description: 'Classic street-style golgappa with 3 flavored waters', price: '₹120', popular: true },
          { name: 'Sev Puri', description: 'Crisp puri, potato, chutneys, nylon sev', price: '₹130', popular: true },
          { name: 'Dahi Papdi Chaat', description: 'Papdi, yogurt, tamarind, mint, pomegranate', price: '₹150', popular: false },
          { name: 'Ragda Pattice', description: 'Potato patties, white pea curry, chutney trio', price: '₹170', popular: false },
        ],
        mains: [
          { name: 'Pav Bhaji', description: 'Street-style mashed vegetable curry and buttered buns', price: '₹180', popular: true },
          { name: 'Vada Pav', description: 'Spiced potato fritter in bun with dry garlic chutney', price: '₹90', popular: true },
          { name: 'Misal Pav', description: 'Sprouted moth beans curry, farsan, pav', price: '₹160', popular: false },
          { name: 'Tawa Pulao', description: 'Spicy rice tossed on tawa with bhaji masala', price: '₹210', popular: false },
        ],
        desserts: [
          { name: 'Kulfi Falooda', description: 'Traditional kulfi with vermicelli and rose syrup', price: '₹190', popular: true },
          { name: 'Rabdi Jalebi', description: 'Hot jalebi with chilled rabdi', price: '₹220', popular: false },
          { name: 'Gajar Halwa', description: 'Slow-cooked carrot pudding, khoya and nuts', price: '₹180', popular: false },
        ],
        drinks: [
          { name: 'Cutting Chai', description: 'Mumbai-style strong ginger tea', price: '₹40', popular: true },
          { name: 'Kala Khatta Soda', description: 'Street classic black plum soda', price: '₹90', popular: false },
          { name: 'Fresh Lime Soda', description: 'Sweet-salted lime and sparkling water', price: '₹120', popular: false },
        ],
      },
    };
  }

  return null;
}

// Menu highlights by cuisine
const getMenuHighlights = (name, cuisine, address) => {
  const byRestaurant = getRestaurantProfile(name);
  if (byRestaurant?.highlights) return byRestaurant.highlights;

  const menus = {
    'Italian': [
      { name: 'Cacio e Pepe', description: 'Hand-rolled tonnarelli, black pepper, aged Pecorino', price: '$28', tag: "Chef's Signature" },
      { name: 'Osso Buco', description: 'Braised veal shank, gremolata, saffron risotto', price: '$52', tag: 'Most Popular' },
      { name: 'Tiramisu', description: 'House-made ladyfingers, espresso, mascarpone cream', price: '$16', tag: 'Must Try' },
    ],
    'Japanese': [
      { name: 'Omakase Nigiri', description: '12-piece chef selection, fish flown daily', price: '$95', tag: "Chef's Signature" },
      { name: 'Wagyu Tataki', description: 'A5 Wagyu, ponzu, micro herbs', price: '$68', tag: 'Most Popular' },
      { name: 'Matcha Soufflé', description: 'Ceremonial grade matcha, yuzu cream', price: '$22', tag: 'Must Try' },
    ],
    'French': [
      { name: 'Foie Gras Torchon', description: 'Sauternes gelée, brioche, fig compote', price: '$42', tag: "Chef's Signature" },
      { name: 'Sole Meunière', description: 'Dover sole, brown butter, capers, lemon', price: '$58', tag: 'Most Popular' },
      { name: 'Crème Brûlée', description: 'Madagascan vanilla, caramelized crust', price: '$18', tag: 'Classic' },
    ],
    'Italian-American': [
      { name: 'Rigatoni Vodka', description: 'San Marzano tomato, calabrian chili, prosciutto', price: '$32', tag: "Chef's Signature" },
      { name: 'Veal Parmesan', description: 'Breaded veal cutlet, house marinara, aged mozzarella', price: '$48', tag: 'Most Popular' },
      { name: 'Cannoli', description: 'Crispy shell, ricotta cream, pistachios', price: '$14', tag: 'Must Try' },
    ],
    'Indian': [
      { name: 'Butter Chicken', description: 'Creamy tomato gravy, smoked chicken tikka, dried fenugreek', price: '₹480', tag: "Chef's Signature" },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils, churned butter, fresh cream', price: '₹350', tag: 'Most Popular' },
      { name: 'Garlic Naan', description: 'Charcoal tandoor baked bread, fresh garlic and coriander', price: '₹80', tag: 'Must Try' },
    ],
  };

  const c = String(cuisine || '').toLowerCase();
  const addr = String(address || '').toLowerCase();
  
  let matched = menus['Italian'];
  if (c.includes('japan') || c.includes('sushi')) matched = menus['Japanese'];
  else if (c.includes('french')) matched = menus['French'];
  else if (c.includes('india') || c.includes('mughlai') || c.includes('punjabi') || c.includes('south') || addr.includes('india') || addr.includes('delhi') || addr.includes('mumbai')) matched = menus['Indian'];
  
  // Also adjust currency depending on region
  if (addr.includes('india') || addr.includes('delhi') || addr.includes('mumbai')) {
     matched = matched.map(m => {
       if (m.price.includes('$')) {
         const numericValue = parseInt(m.price.replace('$', '')) || 0;
         return { ...m, price: `₹${numericValue * 80}` }; // Rough fake conversion just in case fallback happens
       }
       return m;
     });
  }
  return matched;
};

// Michelin star SVG component
const MichelinStar = ({ filled = true, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L14.09 8.26L20.76 8.27L15.45 12.14L17.55 18.39L12 14.77L6.45 18.39L8.55 12.14L3.24 8.27L9.91 8.26L12 2Z"
      fill={filled ? '#C9A84C' : 'none'}
      stroke={filled ? '#C9A84C' : '#4A4845'}
      strokeWidth="1.5"
    />
  </svg>
);

// Star rating display
const MichelinBadge = ({ stars }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(201, 168, 76, 0.1)',
    border: '1px solid rgba(201, 168, 76, 0.3)',
    borderRadius: '100px',
    padding: '6px 14px',
    width: 'fit-content',
  }}>
    {[...Array(3)].map((_, i) => (
      <MichelinStar key={i} filled={i < stars} size={16} />
    ))}
    <span style={{ color: '#C9A84C', fontSize: '12px', marginLeft: '6px', letterSpacing: '0.05em' }}>
      {stars === 1 ? 'MICHELIN STAR' : stars === 2 ? 'TWO MICHELIN STARS' : stars === 3 ? 'THREE MICHELIN STARS' : 'MICHELIN RECOMMENDED'}
    </span>
  </div>
);

export default function RestaurantDetailNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name } = useParams();

  // Get restaurant from navigation state OR reconstruct from URL
  const restaurant = location.state?.restaurant || {
    name: decodeURIComponent(name),
    cuisine: 'Italian',
    description: 'An exceptional dining experience.',
    price_range: '$$$',
    vibe: 'intimate',
    rating: 4.8,
    location: 'New York, NY',
  };

  const michelin = getMichelinStars(restaurant.name, restaurant.cuisine);
  const menuItems = getMenuHighlights(restaurant.name, restaurant.cuisine, restaurant.address || restaurant.location);

  // ─── TAB STATE ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const { user } = useAuth();

  // ─── TAB DATA ───────────────────────────────────────────────────────────

  // Full menu by category
  const getFullMenu = (name, cuisine, address) => {
    const byRestaurant = getRestaurantProfile(name);
    if (byRestaurant?.fullMenu) return byRestaurant.fullMenu;

    const c = String(cuisine || '').toLowerCase();
    const addr = String(address || '').toLowerCase();
    const isIndia = c.includes('india') || c.includes('mughlai') || c.includes('punjabi') || c.includes('south') || addr.includes('india') || addr.includes('delhi') || addr.includes('mumbai');

    if (isIndia) {
      return {
        starters: [
          { name: 'Samosa Chaat', description: 'Crispy pastry, spiced potatoes, chutneys, sweet yogurt', price: '₹220', popular: true },
          { name: 'Paneer Tikka', description: 'Tandoori cottage cheese, yogurt, carom seeds', price: '₹340', popular: false },
          { name: 'Chicken 65', description: 'Spicy, deep-fried chicken bites, curry leaves', price: '₹380', popular: true },
          { name: 'Hara Bhara Kebab', description: 'Spinach and pea cutlets, mint chutney', price: '₹280', popular: false },
        ],
        mains: [
          { name: 'Butter Chicken', description: 'Creamy tomato gravy, smoked chicken tikka, dried fenugreek', price: '₹480', popular: true },
          { name: 'Mutton Biryani', description: 'Slow-cooked fragrant rice, tender goat meat, saffron', price: '₹650', popular: true },
          { name: 'Palak Paneer', description: 'Fresh spinach puree, cottage cheese cubes, garlic temper', price: '₹420', popular: false },
          { name: 'Dal Makhani', description: 'Slow-cooked black lentils, churned butter, fresh cream', price: '₹350', popular: true },
        ],
        desserts: [
          { name: 'Gulab Jamun', description: 'Milk solids dumplings, cardamom sugar syrup, pistachios', price: '₹180', popular: true },
          { name: 'Rasmalai', description: 'Soft paneer discs, saffron milk, almonds', price: '₹220', popular: false },
          { name: 'Kulfi Falooda', description: 'Traditional Indian ice cream, sweet noodles', price: '₹240', popular: false },
        ],
        drinks: [
          { name: 'Mango Lassi', description: 'Sweet yogurt drink, alphonso mango puree', price: '₹150', popular: true },
          { name: 'Masala Chai', description: 'Spiced Indian tea, ginger, cardamom', price: '₹90', popular: false },
          { name: 'Fresh Lime Soda', description: 'Sparkling water, fresh lime, roasted cumin, black salt', price: '₹120', popular: false },
        ]
      };
    }

    return {
      starters: [
        { name: 'Black Cod Miso', description: 'Nobu signature — miso-marinated black cod, broiled to perfection', price: '$38', popular: true },
        { name: 'Toro Tartare', description: 'Bluefin tuna belly, caviar, crispy rice, wasabi soy', price: '$52', popular: false },
        { name: 'Yellowtail Jalapeño', description: 'Sliced yellowtail, jalapeño, yuzu soy, crispy garlic', price: '$28', popular: true },
        { name: 'Rock Shrimp Tempura', description: 'Crispy shrimp, creamy spicy sauce, ponzu', price: '$32', popular: false },
      ],
      mains: [
        { name: 'Wagyu Skewer', description: 'A5 Japanese Wagyu, teriyaki glaze, micro herbs', price: '$85', popular: true },
        { name: 'Lobster with Truffle', description: 'Maine lobster, black truffle butter, soba noodles', price: '$78', popular: false },
        { name: 'Duck Breast Anticucho', description: 'Peruvian-Japanese spiced duck, aji amarillo, quinoa', price: '$56', popular: false },
        { name: 'Omakase Set', description: '12-course chef tasting, seasonal ingredients, sake pairing optional', price: '$195', popular: true },
      ],
      desserts: [
        { name: 'Yuzu Cheesecake', description: 'Japanese yuzu curd, graham cracker, miso caramel', price: '$18', popular: true },
        { name: 'Bento Box Dessert', description: 'Chocolate lava cake, green tea ice cream, mochi', price: '$22', popular: false },
        { name: 'Sake Ice Cream', description: 'House-churned junmai sake ice cream, sesame brittle', price: '$16', popular: false },
      ],
      drinks: [
        { name: 'Nobu Sake Flight', description: '3 premium sakes, tasting notes included', price: '$45', popular: true },
        { name: 'Yuzu Margarita', description: 'Patron silver, yuzu juice, triple sec, salted rim', price: '$22', popular: false },
        { name: 'Japanese Whisky Highball', description: 'Suntory Toki, sparkling water, lemon twist', price: '$24', popular: false },
      ],
    };
  };

  const fullMenu = getFullMenu(restaurant.name, restaurant.cuisine, restaurant.address || restaurant.location);

  // Photo gallery
  const photos = [
    { url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600', caption: 'Omakase Nigiri' },
    { url: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600', caption: 'Wagyu Skewer' },
    { url: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=600', caption: 'Restaurant Interior' },
    { url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600', caption: 'Black Cod Miso' },
    { url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600', caption: 'Chef Selection' },
    { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', caption: 'Dining Room' },
  ];

  // Reviews
  const reviews = [
    {
      name: 'Arjun M.',
      avatar: 'A',
      rating: 5,
      date: 'February 2026',
      title: 'Best omakase outside of Tokyo',
      text: 'The Black Cod Miso alone is worth the trip. Chef\'s team has created something truly transcendent here. The oceanfront setting adds an ethereal quality to the entire evening. Will absolutely return.',
      occasion: 'Anniversary',
      verified: true,
    },
    {
      name: 'Priya S.',
      avatar: 'P',
      rating: 5,
      date: 'January 2026',
      title: 'Flawless from start to finish',
      text: 'We celebrated our anniversary here and it was perfection. The sommelier\'s sake pairing recommendations were spot-on. Service is attentive without being intrusive — the mark of a truly great restaurant.',
      occasion: 'Birthday',
      verified: true,
    },
    {
      name: 'James T.',
      avatar: 'J',
      rating: 4,
      date: 'December 2025',
      title: 'Exceptional food, iconic location',
      text: 'The Yellowtail Jalapeño and Toro Tartare were absolute standouts. Slightly long wait for our table despite having a reservation, but the food more than made up for it. The ocean view at sunset is breathtaking.',
      occasion: 'Business Dinner',
      verified: true,
    },
    {
      name: 'Sofia R.',
      avatar: 'S',
      rating: 5,
      date: 'November 2025',
      title: 'Michelin stars well deserved',
      text: 'Every single dish was a masterpiece. The Wagyu skewer melted in our mouths. Staff remembered it was my birthday without being prompted and brought out a beautiful dessert presentation. Truly five-star service.',
      occasion: 'Birthday',
      verified: true,
    },
  ];

  // ─── HELPER STYLES ──────────────────────────────────────────────────────
  const sectionTitle = {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '28px',
    fontWeight: 400,
    marginBottom: '20px',
    marginTop: 0,
    color: '#C9A84C',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  };

  const menuCardStyle = {
    background: '#18181C',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '16px',
    position: 'relative',
  };

  const popularBadge = {
    fontSize: '10px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#C9A84C',
    background: 'rgba(201,168,76,0.1)',
    border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: '100px',
    padding: '3px 10px',
  };

  const tabStyle = (tab) => ({
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #C9A84C' : '2px solid transparent',
    color: activeTab === tab ? '#F5F0E8' : '#9A9490',
    padding: '14px 4px',
    fontSize: '13px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginRight: '32px',
    fontFamily: 'DM Sans, sans-serif',
  });

  const timeSlots = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'];
  const availableSlots = timeSlots.filter((_, i) => i !== 2 && i !== 5); // some "unavailable"

  const handleBook = () => {
    if (!selectedSlot) return;
    setPendingBooking({
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      date: selectedDate || 'Tonight',
      time: selectedSlot,
      partySize,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (bookingData) => {
    setBookingConfirmed(true);
    setShowPaymentModal(false);
    setTimeout(() => {
      navigate('/confirmation', {
        state: {
          booking: {
            restaurant: restaurant.name,
            cuisine: restaurant.cuisine,
            date: selectedDate || 'Tonight',
            time: selectedSlot,
            partySize,
            bookingId: bookingData.booking?.id || 'RB-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          }
        }
      });
    }, 500);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Show error message to user
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingBooking(null);
    setBookingConfirmed(false);
  };

  // ─── BOOKING PANEL COMPONENT ────────────────────────────────────────────
  const BookingPanel = (
    <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
      <div style={{
        background: '#18181C',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 0 40px rgba(201,168,76,0.05)',
      }}>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '24px', fontWeight: 400,
          marginBottom: '24px', marginTop: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '16px',
        }}>
          Reserve a Table
        </h3>

        {/* Date */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9490', display: 'block', marginBottom: '8px' }}>
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%', background: '#0A0A0B',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
              color: '#F5F0E8', padding: '12px 16px', fontSize: '15px',
              outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
            }}
          />
        </div>

        {/* Party Size */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9490', display: 'block', marginBottom: '8px' }}>
            Guests
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', fontSize: '18px', cursor: 'pointer' }}
            >−</button>
            <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>{partySize}</span>
            <button
              onClick={() => setPartySize(Math.min(12, partySize + 1))}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', fontSize: '18px', cursor: 'pointer' }}
            >+</button>
            <span style={{ color: '#9A9490', fontSize: '14px' }}>people</span>
          </div>
        </div>

        {/* Time Slots */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9490', display: 'block', marginBottom: '12px' }}>
            Available Times
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {timeSlots.map((slot) => {
              const isAvailable = availableSlots.includes(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => isAvailable && setSelectedSlot(slot)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    border: isSelected
                      ? '1px solid #C9A84C'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected
                      ? 'rgba(201,168,76,0.15)'
                      : isAvailable ? '#0A0A0B' : 'transparent',
                    color: isSelected ? '#C9A84C' : isAvailable ? '#F5F0E8' : '#4A4845',
                    textDecoration: !isAvailable ? 'line-through' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reserve Button */}
        <button
          onClick={handleBook}
          disabled={!selectedSlot || bookingConfirmed}
          style={{
            width: '100%',
            padding: '16px',
            background: selectedSlot
              ? 'linear-gradient(135deg, #C9A84C, #E8C97A, #C9A84C)'
              : 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: '4px',
            color: selectedSlot ? '#0A0A0B' : '#4A4845',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: selectedSlot ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selectedSlot ? '0 4px 20px rgba(201,168,76,0.3)' : 'none',
          }}
        >
          {bookingConfirmed ? '✓ Confirming...' : selectedSlot ? `Reserve for ${selectedSlot}` : 'Select a Time First'}
        </button>

        {/* Info */}
        <p style={{ color: '#4A4845', fontSize: '12px', textAlign: 'center', marginTop: '16px', marginBottom: 0 }}>
          Free cancellation up to 24 hours before
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: '#0A0A0B', minHeight: '100vh', color: '#F5F0E8' }}
    >
      {/* ── HERO IMAGE ─────────────────────────────── */}
      <div style={{ position: 'relative', height: '55vh', overflow: 'hidden' }}>
        {/* Gradient placeholder (replace with real image) */}
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, 
            hsl(${Math.abs(restaurant.name.charCodeAt(0) * 5) % 360}, 20%, 15%) 0%, 
            hsl(${Math.abs(restaurant.name.charCodeAt(0) * 7) % 360}, 15%, 8%) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '80px',
        }}>
          🍽️
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to top, #0A0A0B 0%, transparent 100%)',
        }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: '24px', left: '24px',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px',
            color: '#F5F0E8', padding: '10px 20px', cursor: 'pointer',
            fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          ← Back
        </button>

        {/* Restaurant name overlay */}
        <div style={{ position: 'absolute', bottom: '32px', left: '40px', right: '40px' }}>
          <MichelinBadge stars={michelin.stars} />
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 300,
            margin: '12px 0 8px',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}>
            {restaurant.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#9A9490', fontSize: '15px' }}>
            <span>{restaurant.cuisine}</span>
            <span>·</span>
            <span style={{ color: '#C9A84C' }}>
              {(restaurant.location && restaurant.location.toLowerCase().includes('india') ? '₹' : '$').repeat(Math.min(4, (restaurant.price_range?.length || 3)))}{'○'.repeat(Math.max(0, 4 - (restaurant.price_range?.length || 3)))}
            </span>
            <span>·</span>
            <span>📍 {restaurant.location || '2.4 mi away'}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      
      {/* TAB BAR */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 40px',
        display: 'flex',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {['overview', 'menu', 'photos', 'reviews'].map(tab => (
          <button
            key={tab}
            style={tabStyle(tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>

        {/* ════ OVERVIEW TAB ════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px' }}>
            <div>
              {/* Rating & Awards */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[...Array(5)].map((_, i) => (
                    <MichelinStar key={i} filled={i < Math.floor(michelin.rating)} size={20} />
                  ))}
                  <span style={{ fontSize: '20px', fontWeight: 500, marginLeft: '8px' }}>{michelin.rating}</span>
                </div>
                <span style={{ color: '#4A4845' }}>|</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {michelin.awards.map((award, i) => (
                    <span key={i} style={{
                      fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: '100px', padding: '4px 12px',
                    }}>
                      {award}
                    </span>
                  ))}
                </div>
              </div>

              {/* About */}
              <div style={{ marginBottom: '40px' }}>
                <h2 style={sectionTitle}>About</h2>
                <p style={{ color: '#9A9490', lineHeight: 1.8, fontSize: '16px' }}>
                  {restaurant.description || `${restaurant.name} represents the pinnacle of ${restaurant.cuisine} cuisine, where centuries-old tradition meets contemporary innovation. Each dish is a masterclass in technique, sourced from the finest purveyors and executed with meticulous precision.`}
                </p>
                <p style={{ color: '#9A9490', lineHeight: 1.8, fontSize: '16px', marginTop: '12px' }}>
                  The atmosphere is <strong style={{ color: '#F5F0E8' }}>{restaurant.vibe || 'intimate'}</strong> — perfect for special occasions, romantic evenings, and celebrations that deserve to be remembered.
                </p>
              </div>

              {/* Chef's Signatures */}
              <div>
                <h2 style={sectionTitle}>Chef's Signatures</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {menuItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{
                        background: '#18181C',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        padding: '20px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 500 }}>{item.name}</span>
                          <span style={popularBadge}>{item.tag}</span>
                        </div>
                        <p style={{ color: '#9A9490', fontSize: '14px', margin: 0 }}>{item.description}</p>
                      </div>
                      <span style={{ color: '#C9A84C', fontSize: '18px', fontFamily: 'Cormorant Garamond, serif', marginLeft: '24px', whiteSpace: 'nowrap' }}>
                        {item.price}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            {BookingPanel}
          </div>
        )}

        {/* ════ MENU TAB ════════════════════════════════════════════════════════════ */}
        {activeTab === 'menu' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px' }}>
            <div>
              {Object.entries(fullMenu).map(([category, items]) => (
                <div key={category} style={{ marginBottom: '40px' }}>
                  <h2 style={sectionTitle}>{category.toUpperCase()}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          background: '#18181C',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '18px 24px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 500 }}>{item.name}</span>
                            {item.popular && (
                              <span style={popularBadge}>⭐ Popular</span>
                            )}
                          </div>
                          <p style={{ color: '#9A9490', fontSize: '14px', margin: 0 }}>{item.description}</p>
                        </div>
                        <span style={{ color: '#C9A84C', fontSize: '18px', fontFamily: 'Cormorant Garamond, serif', whiteSpace: 'nowrap' }}>
                          {item.price}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {BookingPanel}
          </div>
        )}

        {/* ════ PHOTOS TAB ══════════════════════════════════════════════════════════ */}
        {activeTab === 'photos' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {photos.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    aspectRatio: '4/3',
                    cursor: 'pointer',
                    background: '#18181C',
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.style.background = '#18181C';
                    }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: '20px 16px 12px',
                    color: '#F5F0E8', fontSize: '13px',
                  }}>
                    {photo.caption}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ════ REVIEWS TAB ═════════════════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px' }}>
            <div>
              {/* Rating Summary */}
              <div style={{
                background: '#18181C',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '64px', fontFamily: 'Cormorant Garamond, serif', color: '#C9A84C', lineHeight: 1 }}>
                    {michelin.rating}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', margin: '8px 0' }}>
                    {[...Array(5)].map((_, i) => (
                      <MichelinStar key={i} filled={i < Math.floor(michelin.rating)} size={18} />
                    ))}
                  </div>
                  <div style={{ color: '#9A9490', fontSize: '13px' }}>{reviews.length} reviews</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct = (count / reviews.length) * 100;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ color: '#9A9490', fontSize: '13px', width: '16px' }}>{star}</span>
                        <MichelinStar filled size={14} />
                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#C9A84C', borderRadius: '2px' }} />
                        </div>
                        <span style={{ color: '#9A9490', fontSize: '13px', width: '24px' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      background: '#18181C',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar */}
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#0A0A0B', fontWeight: 600, fontSize: '16px',
                        }}>
                          {review.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '15px' }}>
                            {review.name}
                            {review.verified && <span style={{ color: '#10B981', fontSize: '11px', marginLeft: '8px' }}>✓ Verified</span>}
                          </div>
                          <div style={{ color: '#9A9490', fontSize: '12px' }}>{review.date} · {review.occasion}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(review.rating)].map((_, i) => (
                          <MichelinStar key={i} filled size={14} />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: '8px', fontSize: '15px' }}>{review.title}</div>
                    <p style={{ color: '#9A9490', lineHeight: 1.7, margin: 0, fontSize: '14px' }}>{review.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            {BookingPanel}
          </div>
        )}


      </div>
      
      {/* Payment Modal */}
      {pendingBooking && (
        <PaymentModal
          booking={pendingBooking}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
          isOpen={showPaymentModal}
        />
      )}
    </motion.div>
  );
}
