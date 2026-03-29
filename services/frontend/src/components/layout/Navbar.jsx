import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOwner = user?.role === 'owner';
  const p = location.pathname;

  const customerLinks = [
    { label: 'Home', path: '/' },
    { label: 'Chat', path: '/chat' },
    { label: 'My Bookings', path: '/bookings' },
  ];
  const ownerLinks = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Bookings', path: '/dashboard/bookings' },
    { label: 'Menu', path: '/dashboard/menu' },
    { label: 'Analytics', path: '/dashboard/analytics' },
  ];
  const links = isOwner ? ownerLinks : customerLinks;

  return (
    <nav style={{ background: 'rgba(6,5,7,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.04)', height: 64, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 32, position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
      <div onClick={() => navigate(isOwner ? '/dashboard' : '/')} style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)', letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        ✦ DINE.AI
        {isOwner && <span style={{ fontSize: 9, letterSpacing: 12, color: 'var(--o-blue)', background: 'rgba(91,141,217,0.1)', border: '1px solid rgba(91,141,217,0.2)', borderRadius: 4, padding: '3px 8px', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>Owner</span>}
      </div>

      <div style={{ display: 'flex', gap: 28, flex: 1, justifyContent: 'center' }}>
        {links.map(l => (
          <button key={l.path} className={`nav-link${isOwner ? ' owner-link' : ''}${p === l.path || p.startsWith(l.path + '/') ? ' active' : ''}`}
            onClick={() => navigate(l.path)}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            {!isOwner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 100, padding: '6px 14px', cursor: 'pointer' }} onClick={() => navigate('/credits')}>
                <span>🪙</span>
                <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{user.credits}</span>
              </div>
            )}
            {isOwner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(72,187,120,0.08)', border: '1px solid rgba(72,187,120,0.2)', borderRadius: 100, padding: '6px 14px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#48bb78', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#48bb78', fontSize: 11 }}>12 bookings today</span>
              </div>
            )}
            <div style={{ width: 34, height: 34, borderRadius: isOwner ? 8 : '50%', background: 'linear-gradient(135deg,var(--gold),var(--ember))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#060507', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              onClick={logout} title="Logout">
              {user.avatar}
            </div>
          </>
        ) : (
          <button onClick={() => navigate('/auth')} style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#060507', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
