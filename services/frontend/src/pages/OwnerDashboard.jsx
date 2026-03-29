import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sections = [
  { path: '/dashboard', key: 'overview', label: 'Overview' },
  { path: '/dashboard/bookings', key: 'bookings', label: 'Bookings' },
  { path: '/dashboard/availability', key: 'availability', label: 'Availability' },
  { path: '/dashboard/profile', key: 'profile', label: 'Profile' },
  { path: '/dashboard/analytics', key: 'analytics', label: 'Analytics' },
];

const statCard = {
  background: '#18181C',
  border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: '12px',
  padding: '22px',
};

const times = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];

export default function OwnerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    today_bookings: 0,
    week_revenue: 0,
    utilization_rate: 0,
    avg_rating: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState({});
  const [profile, setProfile] = useState({
    restaurantName: user?.name ? `${user.name}'s Restaurant` : 'Owner Restaurant',
    description: 'Fine dining destination for elevated evenings.',
    hours: '5:30 PM - 11:00 PM',
    location: 'Manhattan, New York',
  });
  const [loading, setLoading] = useState(false);

  const currentSection = useMemo(() => {
    const found = sections.find((s) => s.path === location.pathname);
    return found?.key || 'overview';
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsResp, bookingResp] = await Promise.all([
          fetch('/api/v1/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/v1/dashboard/bookings?date=today&status=all', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsResp.ok) {
          const data = await statsResp.json();
          setStats(data);
        }

        if (bookingResp.ok) {
          const data = await bookingResp.json();
          setBookings(data.bookings || []);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
  }, [token]);

  const toggleAvailability = async (day, slot) => {
    const key = `${day}_${slot}`;
    const next = !availability[key];
    setAvailability((prev) => ({ ...prev, [key]: next }));

    await fetch('/api/v1/dashboard/availability', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: day, time_slot: slot, is_available: next }),
    });
  };

  const renderOverview = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        <div style={statCard}>
          <div style={{ color: '#9A9490', fontSize: '12px' }}>Today\'s Bookings</div>
          <div style={{ color: '#F5F0E8', fontSize: '28px', marginTop: '8px' }}>{stats.today_bookings}</div>
        </div>
        <div style={statCard}>
          <div style={{ color: '#9A9490', fontSize: '12px' }}>This Week Revenue</div>
          <div style={{ color: '#F5F0E8', fontSize: '28px', marginTop: '8px' }}>${stats.week_revenue}</div>
        </div>
        <div style={statCard}>
          <div style={{ color: '#9A9490', fontSize: '12px' }}>Table Utilization</div>
          <div style={{ color: '#F5F0E8', fontSize: '28px', marginTop: '8px' }}>{stats.utilization_rate}%</div>
        </div>
        <div style={statCard}>
          <div style={{ color: '#9A9490', fontSize: '12px' }}>Average Rating</div>
          <div style={{ color: '#F5F0E8', fontSize: '28px', marginTop: '8px' }}>{stats.avg_rating}</div>
        </div>
      </div>

      <div style={{ ...statCard, marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Recent Bookings</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#F5F0E8' }}>
          <thead>
            <tr style={{ color: '#9A9490', fontSize: '12px', textAlign: 'left' }}>
              <th>Time</th>
              <th>Guest Name</th>
              <th>Party Size</th>
              <th>Special Requests</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 6).map((b) => (
              <tr key={b._id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '12px 0' }}>{b.time || b.time_slot}</td>
                <td>{b.guest_name || 'Guest'}</td>
                <td>{b.party_size}</td>
                <td>{b.special_requests || '-'}</td>
                <td style={{ color: b.status === 'confirmed' ? '#10B981' : '#9A9490' }}>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={statCard}>
        <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Block dates', 'Update hours', 'Add special menu', 'Send announcement'].map((action) => (
            <button
              key={action}
              style={{
                padding: '10px 14px',
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#F5F0E8',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderBookings = () => (
    <div style={statCard}>
      <h3 style={{ marginTop: 0, color: '#C9A84C' }}>All Bookings</h3>
      {bookings.map((b) => (
        <div
          key={b._id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 80px 1fr 120px',
            gap: '8px',
            padding: '12px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            color: '#F5F0E8',
          }}
        >
          <span>{b.time || b.time_slot}</span>
          <span>{b.guest_name || 'Guest'}</span>
          <span>{b.party_size}</span>
          <span>{b.special_requests || '-'}</span>
          <span>{b.status}</span>
        </div>
      ))}
    </div>
  );

  const renderAvailability = () => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date();
      dt.setDate(dt.getDate() + i);
      return dt.toISOString().slice(0, 10);
    });

    return (
      <div style={statCard}>
        <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Availability Grid</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {days.map((day) => (
            <div key={day}>
              <div style={{ color: '#9A9490', fontSize: '12px', marginBottom: '8px' }}>{day}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {times.map((slot) => {
                  const key = `${day}_${slot}`;
                  const enabled = !!availability[key];
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleAvailability(day, slot)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: enabled ? 'rgba(201,168,76,0.2)' : '#0A0A0B',
                        color: enabled ? '#C9A84C' : '#9A9490',
                        cursor: 'pointer',
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div style={statCard}>
      <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Restaurant Profile</h3>
      {Object.keys(profile).map((field) => (
        <div key={field} style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: '#9A9490', fontSize: '12px', marginBottom: '6px' }}>{field}</label>
          <input
            value={profile[field]}
            onChange={(e) => setProfile((prev) => ({ ...prev, [field]: e.target.value }))}
            style={{
              width: '100%',
              background: '#0A0A0B',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F5F0E8',
              borderRadius: '8px',
              padding: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
      <button style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
        color: '#0A0A0B',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
      }}>
        Save Profile
      </button>
    </div>
  );

  const renderAnalytics = () => (
    <div style={statCard}>
      <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Revenue & Occupancy</h3>
      <div style={{ color: '#9A9490' }}>Weekly revenue: ${stats.week_revenue}</div>
      <div style={{ color: '#9A9490', marginTop: '8px' }}>Utilization: {stats.utilization_rate}%</div>
      <div style={{ marginTop: '22px', height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px' }}>
        <div style={{ width: `${stats.utilization_rate}%`, height: '100%', background: '#C9A84C', borderRadius: '999px' }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 24px 60px' }}>
      <h1 style={{ color: '#F5F0E8', marginBottom: '14px' }}>Restaurant Owner Dashboard</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {sections.map((section) => {
          const active = location.pathname === section.path;
          return (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              style={{
                background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                border: active ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: active ? '#C9A84C' : '#9A9490',
                padding: '10px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      {loading ? <div style={{ color: '#9A9490' }}>Loading dashboard...</div> : null}
      {!loading && currentSection === 'overview' ? renderOverview() : null}
      {!loading && currentSection === 'bookings' ? renderBookings() : null}
      {!loading && currentSection === 'availability' ? renderAvailability() : null}
      {!loading && currentSection === 'profile' ? renderProfile() : null}
      {!loading && currentSection === 'analytics' ? renderAnalytics() : null}
    </div>
  );
}
