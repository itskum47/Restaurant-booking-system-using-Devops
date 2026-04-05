import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../hooks/useAI';
import BubbleAI from '../components/chat/BubbleAI';
import BubbleUser from '../components/chat/BubbleUser';
import TypingDots from '../components/chat/TypingDots';

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Chat() {
  const [messages, setMessages] = useState([{ role: 'ai', text: `${getTimeGreeting()}. I'm your personal dining concierge. What are we having today?`, source: 'ai', sourceReason: 'welcome' }]);
  const [input, setInput] = useState('');
  const [recs, setRecs] = useState([]);
  const { chat, loading } = useAI();
  const chatRef = useRef(null);
  const navigate = useNavigate();

  const lastAiMessage = [...messages].reverse().find((m) => m.role === 'ai');
  const panelSource = lastAiMessage?.source || 'ai';
  const panelReason = lastAiMessage?.sourceReason || 'welcome';

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input;

    setMessages(m => [...m, { role: 'user', text: txt }]);
    setInput('');
    setRecs([]);

    const { text, restaurants, source, sourceReason } = await chat(txt, messages);

    setRecs(restaurants);
    try {
      const byId = restaurants.reduce((acc, restaurant) => {
        if (restaurant?.id) {
          acc[String(restaurant.id)] = restaurant;
        }
        return acc;
      }, {});
      sessionStorage.setItem('restaurantCache', JSON.stringify(byId));
    } catch {
      // Ignore storage failures in private mode or restricted environments.
    }
    setMessages(m => [...m, { role: 'ai', text, source: source || 'ai', sourceReason: sourceReason || 'unknown' }]);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left: Chat */}
      <div style={{ flex: '0 0 54%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 14, animation: 'pulse 2.5s infinite' }}>✦</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--cream)', fontWeight: 600 }}>The Concierge</div>
            <div style={{ color: 'var(--faint)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 1 }}>AI Dining Intelligence</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#48bb78', animation: 'pulse 1.5s infinite' }} />
            <span style={{ color: '#48bb78', fontSize: 11 }}>Online</span>
            <span
              style={{
                color: panelSource === 'ai' ? '#48bb78' : '#d69e2e',
                fontSize: 10,
                border: `1px solid ${panelSource === 'ai' ? 'rgba(72,187,120,0.35)' : 'rgba(214,158,46,0.35)'}`,
                borderRadius: 999,
                padding: '2px 8px',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}
            >
              {panelSource === 'ai' ? 'AI Live' : 'Fallback'}
            </span>
          </div>
        </div>

        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {messages.map((m, i) => m.role === 'ai' ? (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, color: m.source === 'ai' ? '#48bb78' : '#d69e2e', letterSpacing: '.08em', textTransform: 'uppercase', marginLeft: 6 }}>
                {m.source === 'ai' ? 'AI Live' : 'Fallback'} · {m.sourceReason || 'unknown'}
              </div>
              <BubbleAI text={m.text} />
            </div>
          ) : <BubbleUser key={i} text={m.text} />)}
          {loading && <TypingDots />}
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10, background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, padding: '10px 10px 10px 24px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type your dining wish..." style={{ flex: 1, background: 'none', border: 'none', color: 'var(--cream)', fontSize: 14 }} />
            <button onClick={send} style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', border: 'none', borderRadius: '50%', width: 38, height: 38, color: '#060507', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>↑</button>
          </div>
        </div>
      </div>

      {/* Right: Recommendations */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-deep)', padding: '24px 20px' }}>
        <div style={{ marginBottom: 10, fontSize: 11, color: panelSource === 'ai' ? '#48bb78' : '#d69e2e', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Source: {panelSource === 'ai' ? 'AI Live' : 'Fallback'} ({panelReason})
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, color: 'var(--cream)', fontWeight: 600
          }}>
            Tonight's Selection
          </div>
          <div style={{ color: 'var(--faint)', fontSize: 12, marginTop: 3 }}>
            {loading
              ? 'Finding the perfect tables...'
              : recs.length > 0
                ? `${recs.length} curated for you`
                : 'Ask me anything...'}
          </div>
        </div>

        {loading && recs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 160,
                borderRadius: 14,
                background: 'linear-gradient(90deg, #130f18 25%, #1a1525 50%, #130f18 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
                border: '1px solid rgba(255,255,255,0.04)',
              }} />
            ))}
          </div>
        )}

        {!loading && recs.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--faint)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 13, letterSpacing: '.1em' }}>Your recommendations appear here</div>
          </div>
        ) : recs.map((r, i) => (
          <div
            key={r.id}
            className="card-3d"
            onClick={() => {
              try {
                const raw = sessionStorage.getItem('restaurantCache');
                const current = raw ? JSON.parse(raw) : {};
                current[String(r.id)] = r;
                sessionStorage.setItem('restaurantCache', JSON.stringify(current));
              } catch {
                // Ignore storage failures in private mode or restricted environments.
              }
              navigate(`/restaurant/${r.id}`, { state: { restaurant: r } });
            }}
            style={{ background: `linear-gradient(135deg,${r.color1},${r.color2})`, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', marginBottom: 14, animation: `slideUp .5s ${i * .1}s both` }}>
            <div style={{ padding: '18px 18px 0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{r.emoji}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)', fontWeight: 600 }}>{r.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{r.cuisine} · {r.price} · {r.tag}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-gold)', borderRadius: 100, padding: '5px 11px', height: 'fit-content', display: 'flex', gap: 2, alignItems: 'center' }}>
                {[...Array(r.stars)].map((_, j) => <span key={j} style={{ color: 'var(--gold)', fontSize: 10 }}>★</span>)}
                <span style={{ color: 'var(--gold)', fontSize: 10, marginLeft: 3, fontFamily: 'var(--font-mono)' }}>{r.rating}</span>
              </div>
            </div>
            <div style={{ padding: '10px 18px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {r.times.map(t => <span key={t} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border-gold)', borderRadius: 100, padding: '4px 12px', color: 'var(--gold)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{t} PM</span>)}
            </div>
            <div style={{ padding: '0 18px 16px' }}>
              <button className="book-slide" style={{ width: '100%', background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', border: 'none', borderRadius: 8, padding: 12, color: '#060507', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Reserve a Table →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
