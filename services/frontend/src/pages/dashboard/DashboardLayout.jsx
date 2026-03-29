import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const NAV = [
    { ic: '⬡', label: 'Overview', path: '/dashboard' },
    { ic: '📅', label: 'Bookings', path: '/dashboard/bookings' },
    { ic: '🍽', label: 'Menu', path: '/dashboard/menu' },
    { ic: '📊', label: 'Analytics', path: '/dashboard/analytics' },
    { ic: '⚙️', label: 'Settings', path: '/dashboard/settings' },
];

export default function DashboardLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <div className="owner-scroll" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {/* Sidebar */}
            <div style={{ width: 220, flexShrink: 0, background: '#0c0b0f', borderRight: '1px solid var(--o-border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--o-border)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold)', letterSpacing: 3 }}>✦ DINE.AI</div>
                    <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '.18em', color: 'var(--o-blue)', background: 'rgba(91,141,217,0.08)', border: '1px solid rgba(91,141,217,0.15)', borderRadius: 4, padding: '3px 8px', display: 'inline-block', textTransform: 'uppercase' }}>Owner Portal</div>
                </div>
                <nav style={{ padding: '16px 10px', flex: 1 }}>
                    {NAV.map(item => (
                        <button key={item.path}
                            className={`sidebar-item${(pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))) ? ' active' : ''}`}
                            onClick={() => navigate(item.path)}>
                            <span style={{ fontSize: 15, width: 20 }}>{item.ic}</span>{item.label}
                        </button>
                    ))}
                </nav>
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--o-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,var(--gold),var(--ember))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🍽</div>
                        <div>
                            <div style={{ color: 'var(--o-text)', fontSize: 12, fontWeight: 500 }}>Nobu Malibu</div>
                            <div style={{ color: 'var(--o-muted)', fontSize: 10 }}>Restaurant Owner</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page content */}
            <div className="owner-scroll" style={{ flex: 1, overflowY: 'auto', background: 'var(--o-bg)' }}>
                <Outlet />
            </div>
        </div>
    );
}
