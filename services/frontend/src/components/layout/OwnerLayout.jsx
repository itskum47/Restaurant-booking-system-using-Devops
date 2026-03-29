import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: '◆' },
  { path: '/dashboard/bookings', label: 'Bookings', icon: '◈' },
  { path: '/dashboard/menu', label: 'Menu Manager', icon: '🍽' },
  { path: '/dashboard/availability', label: 'Availability', icon: '◇' },
  { path: '/dashboard/analytics', label: 'Analytics', icon: '◆' },
  { path: '/dashboard/profile', label: 'Profile', icon: '○' },
];

export default function OwnerLayout({ children }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[220px] fixed left-0 top-16 bottom-0 bg-[#0d1b2a] border-r border-[rgba(59,130,246,0.15)] flex-col owner-scrollbar">
        <div className="p-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] rounded-full text-[10px] uppercase tracking-[0.12em] text-[#60a5fa] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
            Owner Portal
          </div>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`owner-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="owner-active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#3b82f6]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[rgba(59,130,246,0.15)]">
          <div className="flex items-center gap-2 text-xs text-[rgba(245,240,232,0.6)]">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Restaurant Open</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-[220px] p-6 pt-24 owner-scrollbar">
        {children}
      </main>

      {/* Mobile sidebar - Top bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-[#0d1b2a] border-b border-[rgba(59,130,246,0.15)] z-40 overflow-x-auto">
        <div className="flex items-center gap-2 px-4 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-shrink-0 px-4 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[rgba(59,130,246,0.2)] text-[#60a5fa] border border-[rgba(59,130,246,0.3)]'
                    : 'text-[rgba(245,240,232,0.7)] hover:text-[#60a5fa]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
