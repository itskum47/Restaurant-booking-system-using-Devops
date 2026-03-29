import { useState } from 'react';

// Mock bookings data
const MOCK_BOOKINGS = [
  { id: 'RB-001', time: '6:30 PM', date: 'Today', guest: 'Arjun M.',    email: 'arjun@email.com',  size: 2, occasion: '💍 Anniversary', requests: 'Window seat',   pkg: 'Romance',  status: 'confirmed' },
  { id: 'RB-002', time: '7:00 PM', date: 'Today', guest: 'Priya S.',    email: 'priya@email.com',  size: 4, occasion: '🎂 Birthday',    requests: 'Cake surprise',  pkg: 'Birthday', status: 'pending'   },
  { id: 'RB-003', time: '7:30 PM', date: 'Today', guest: 'James T.',    email: 'james@email.com',  size: 2, occasion: '—',              requests: 'None',           pkg: '—',        status: 'confirmed' },
  { id: 'RB-004', time: '8:00 PM', date: 'Today', guest: 'Sofia R.',    email: 'sofia@email.com',  size: 6, occasion: '💼 Corporate',   requests: 'Separate bills', pkg: 'Group',    status: 'pending'   },
  { id: 'RB-005', time: '8:30 PM', date: 'Today', guest: 'Rahul K.',    email: 'rahul@email.com',  size: 2, occasion: '🌹 Date Night',  requests: 'None',           pkg: '—',        status: 'confirmed' },
  { id: 'RB-006', time: '9:00 PM', date: 'Today', guest: 'Emma W.',     email: 'emma@email.com',   size: 3, occasion: '🥂 Celebration', requests: 'Vegan menu',     pkg: '—',        status: 'confirmed' },
  { id: 'RB-007', time: '7:00 PM', date: 'Tomorrow', guest: 'Liam B.', email: 'liam@email.com',   size: 2, occasion: '—',              requests: 'None',           pkg: '—',        status: 'confirmed' },
  { id: 'RB-008', time: '8:30 PM', date: 'Tomorrow', guest: 'Mia C.',  email: 'mia@email.com',    size: 4, occasion: '🎂 Birthday',    requests: 'Balloons',       pkg: 'Birthday', status: 'pending'   },
];

export default function DashboardBookings() {
  const [filter, setFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Today');
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);

  const handleConfirm = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
  };

  const handleCancel = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const filtered = bookings.filter(b => {
    const matchDate   = dateFilter === 'All Dates' || b.date === dateFilter;
    const matchStatus = filter === 'All' || b.status === filter.toLowerCase();
    return matchDate && matchStatus;
  });

  const counts = {
    all:       bookings.filter(b => b.date === dateFilter || dateFilter === 'All Dates').length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'Outfit', sans-serif", color: '#E2E8F0', background: '#08090B', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
          All Bookings
        </h1>
        <p style={{ color: '#718096', fontSize: '13px' }}>
          Manage all reservations · {counts.pending > 0 && <span style={{ color: '#F6AD55' }}>{counts.pending} pending confirmation</span>}
        </p>
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>

        {/* Date tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#161820', border: '1px solid rgba(99,179,237,0.08)', borderRadius: '100px', padding: '4px' }}>
          {['Today', 'Tomorrow', 'This Week', 'All Dates'].map(d => (
            <button key={d} onClick={() => setDateFilter(d)} style={{
              background: dateFilter === d ? 'rgba(99,179,237,0.15)' : 'transparent',
              border: 'none', borderRadius: '100px', padding: '7px 16px',
              color: dateFilter === d ? '#63B3ED' : '#718096',
              fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Outfit', sans-serif",
            }}>{d}</button>
          ))}
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['All', counts.all], ['Pending', counts.pending], ['Confirmed', counts.confirmed]].map(([f, count]) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? 'rgba(99,179,237,0.12)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(99,179,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
              color: filter === f ? '#63B3ED' : '#718096',
              borderRadius: '6px', padding: '7px 16px', fontSize: '12px', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {f} {count > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', padding: '2px 7px', fontSize: '10px' }}>{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#161820', border: '1px solid rgba(99,179,237,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#4A5568' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '16px' }}>No bookings found</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Time', 'Guest', 'Size', 'Occasion', 'Special Requests', 'Package', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#4A5568', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '15px 16px' }}>
                    <div style={{ color: '#63B3ED', fontFamily: "'Fira Code', monospace", fontSize: '13px' }}>{b.time}</div>
                    <div style={{ color: '#4A5568', fontSize: '10px', marginTop: '2px' }}>{b.date}</div>
                  </td>
                  <td style={{ padding: '15px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{b.guest}</div>
                    <div style={{ color: '#4A5568', fontSize: '11px', marginTop: '2px' }}>{b.email}</div>
                  </td>
                  <td style={{ padding: '15px 16px', color: '#718096', fontSize: '13px' }}>{b.size} guests</td>
                  <td style={{ padding: '15px 16px', fontSize: '13px' }}>{b.occasion}</td>
                  <td style={{ padding: '15px 16px', color: '#718096', fontSize: '13px' }}>{b.requests}</td>
                  <td style={{ padding: '15px 16px' }}>
                    {b.pkg !== '—'
                      ? <span style={{ background: 'rgba(212,168,71,0.1)', border: '1px solid rgba(212,168,71,0.2)', color: '#D4A847', borderRadius: '4px', padding: '3px 10px', fontSize: '11px' }}>{b.pkg}</span>
                      : <span style={{ color: '#4A5568' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '15px 16px' }}>
                    {b.status === 'confirmed' && <span style={{ background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)', color: '#48BB78', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Confirmed</span>}
                    {b.status === 'pending'   && <span style={{ background: 'rgba(246,173,85,0.1)',  border: '1px solid rgba(246,173,85,0.3)',  color: '#F6AD55', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pending</span>}
                    {b.status === 'cancelled' && <span style={{ background: 'rgba(252,129,129,0.1)',border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cancelled</span>}
                  </td>
                  <td style={{ padding: '15px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {b.status === 'pending' && (
                        <button onClick={() => handleConfirm(b.id)} style={{ background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.25)', color: '#48BB78', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit',sans-serif" }}>
                          ✓ Confirm
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(b.id)} style={{ background: 'transparent', border: '1px solid rgba(252,129,129,0.2)', color: '#FC8181', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit',sans-serif" }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      <div style={{ marginTop: '12px', color: '#4A5568', fontSize: '12px', textAlign: 'right' }}>
        Showing {filtered.length} reservation{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
