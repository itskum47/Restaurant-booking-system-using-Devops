import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const stats = {
    todayBookings: 12,
    weekRevenue: 847,
    utilization: 78,
    avgRating: 4.8,
    pendingConfirmations: 3,
  };

  const allBookings = [
    { time: '7:00 PM', guest: 'Arjun M.', party: 2, occasion: 'Anniversary', requests: 'Window seat', status: 'confirmed' },
    { time: '7:30 PM', guest: 'Priya S.', party: 4, occasion: 'Birthday', requests: 'Cake surprise', status: 'pending' },
    { time: '8:00 PM', guest: 'James T.', party: 2, occasion: '-', requests: 'None', status: 'confirmed' },
    { time: '8:30 PM', guest: 'Sofia R.', party: 6, occasion: 'Corporate', requests: 'Separate bill', status: 'pending' },
    { time: '9:00 PM', guest: 'Rahul K.', party: 2, occasion: 'Date Night', requests: 'None', status: 'confirmed' },
  ];

  const filteredBookings = activeFilter === 'all' 
    ? allBookings 
    : allBookings.filter(b => b.status === activeFilter);

  return (
    <div className="owner-scrollbar">
      <div className="mb-8">
        <h1 className="font-[var(--font-display)] text-4xl font-light m-0">
          Good evening, Owner ✦
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Monday, March 9 · {stats.pendingConfirmations} bookings need confirmation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Today's Bookings", value: stats.todayBookings, progress: 60, unit: '', icon: '📅' },
          { label: 'Week Revenue', value: stats.weekRevenue, progress: 73, unit: '$', icon: '💰' },
          { label: 'Table Utilization', value: stats.utilization, progress: 78, unit: '%', icon: '🪑' },
          { label: 'Average Rating', value: stats.avgRating, progress: 96, unit: '', icon: '⭐' },
        ].map((stat) => (
          <div key={stat.label} className="kpi-card">
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="kpi-label">{stat.label}</div>
            <div className="kpi-number">{stat.unit}{stat.value}{!stat.unit && stat.label.includes('%') ? '%' : ''}</div>
            <div className="kpi-progress">
              <div className="kpi-progress-fill" style={{ width: `${stat.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="kpi-card mb-5 overflow-x-auto">
        <h2 className="font-[var(--font-display)] text-2xl font-normal mt-0 mb-5 text-[#60a5fa]">
          Today's Reservations
        </h2>
        
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <table className="owner-table" style={{ minWidth: '820px' }}>
          <thead>
            <tr>
              {['Time', 'Guest', 'Party', 'Occasion', 'Special Requests', 'Status', 'Actions'].map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={`${booking.time}-${booking.guest}`}>
                <td className="time-col">{booking.time}</td>
                <td style={{ fontWeight: 500 }}>{booking.guest}</td>
                <td className="text-[var(--text-secondary)]">{booking.party} guests</td>
                <td className="text-[var(--text-secondary)]">{booking.occasion}</td>
                <td className="text-[var(--text-secondary)] text-sm">{booking.requests}</td>
                <td>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] tracking-wider uppercase ${
                      booking.status === 'confirmed'
                        ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border border-[rgba(16,185,129,0.3)]'
                        : 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <button className="confirm-btn">
                        ✓ Confirm
                      </button>
                    )}
                    <button className="px-3 py-1.5 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] rounded-md text-xs cursor-pointer transition-all hover:bg-[rgba(239,68,68,0.2)]">
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Block Dates', icon: '🚫', action: '/dashboard/availability' },
          { label: 'Update Menu', icon: '🍽️', action: '/dashboard/menu' },
          { label: 'View Analytics', icon: '📊', action: '/dashboard/analytics' },
          { label: 'Message Guests', icon: '💬', action: '/dashboard/bookings' },
        ].map((action) => (
          <button
            key={action.action}
            onClick={() => navigate(action.action)}
            className="kpi-card flex items-center gap-3 cursor-pointer text-[var(--text-primary)] text-sm transition-all hover:bg-[rgba(59,130,246,0.05)] hover:border-[rgba(59,130,246,0.3)]"
          >
            <span className="text-2xl">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
