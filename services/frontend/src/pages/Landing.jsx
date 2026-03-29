import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RESTAURANTS } from '../data/restaurants';

export default function Landing() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}
      onMouseMove={e => setMouse({ x: (e.clientX / window.innerWidth - .5) * 40, y: (e.clientY / window.innerHeight - .5) * 40 })}>
      <div className="grain-overlay" />

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '25%', left: '50%', width: 800, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(201,168,76,0.065) 0%,transparent 68%)', transform: `translate(calc(-50% + ${mouse.x}px),calc(-50% + ${mouse.y}px))`, transition: 'transform .12s ease' }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '8%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(232,96,44,0.055) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '65%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(91,141,217,0.04) 0%,transparent 70%)' }} />
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '0 24px', textAlign: 'center' }}>

        <div className="animate-fadeup" style={{ animationDelay: '.1s', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ width: 56, height: 1, background: 'linear-gradient(to right,transparent,var(--gold))' }} />
          <span style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '.35em', textTransform: 'uppercase' }}>The AI Dining Concierge</span>
          <div style={{ width: 56, height: 1, background: 'linear-gradient(to left,transparent,var(--gold))' }} />
        </div>

        <h1 className="animate-fadeup" style={{ animationDelay: '.2s', fontFamily: 'var(--font-display)', fontSize: 'clamp(60px,9vw,108px)', fontWeight: 700, lineHeight: .88, letterSpacing: '-3px', color: 'var(--cream)', marginBottom: 10 }}>
          Where Every
        </h1>
        <h1 className="animate-fadeup gold-text" style={{ animationDelay: '.3s', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(60px,9vw,108px)', fontWeight: 300, lineHeight: .88, letterSpacing: '-2px', marginBottom: 44 }}>
          Meal is Magic
        </h1>

        <p className="animate-fadeup" style={{ animationDelay: '.45s', color: 'var(--muted)', fontSize: 17, fontWeight: 300, maxWidth: 500, lineHeight: 1.8, marginBottom: 52 }}>
          Tell our AI what you desire. We'll find the perfect table, the perfect moment, the perfect evening.
        </p>

        <div className="animate-fadeup" style={{ animationDelay: '.55s', display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 100, padding: '9px 9px 9px 30px', width: '100%', maxWidth: 620, boxShadow: '0 0 80px rgba(201,168,76,0.1)', cursor: 'pointer', transition: 'all .3s' }}
          onClick={() => navigate('/chat')}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(201,168,76,0.4),0 0 80px rgba(201,168,76,0.2)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 80px rgba(201,168,76,0.1)'}>
          <span className="animate-pulse" style={{ color: 'var(--gold)', fontSize: 18, marginRight: 12 }}>✦</span>
          <span style={{ flex: 1, color: 'var(--faint)', fontSize: 14, textAlign: 'left' }}>"Romantic dinner for 2 in Bandra, tonight..."</span>
          <button className="animate-glow" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', border: 'none', borderRadius: 100, padding: '14px 26px', color: '#060507', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Find Table
          </button>
        </div>

        <div className="animate-fadeup" style={{ animationDelay: '.7s', display: 'flex', gap: 52, marginTop: 56 }}>
          {[["4,200+", "Partner Restaurants"], ["60+", "Cities Worldwide"], ["99%", "Guest Satisfaction"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--gold)' }}>{v}</div>
              <div style={{ color: 'var(--faint)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling strip */}
      <div style={{ overflow: 'hidden', paddingBottom: 48, position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#2a2530', fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>Tonight's Most Coveted Tables</div>
        <div style={{ display: 'flex', gap: 18, animation: 'scrollL 22s linear infinite', width: 'max-content' }}>
          {[...RESTAURANTS, ...RESTAURANTS].map((r, i) => (
            <div key={i} style={{ width: 190, height: 100, background: `linear-gradient(135deg,${r.color1},${r.color2})`, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => navigate('/chat')}>
              <div style={{ fontSize: 24 }}>{r.emoji}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--cream)', fontWeight: 600 }}>{r.name}</div>
                <div style={{ color: 'var(--faint)', fontSize: 10, marginTop: 2 }}>{r.cuisine}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
