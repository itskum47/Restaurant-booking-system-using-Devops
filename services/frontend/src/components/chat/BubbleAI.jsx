export default function BubbleAI({ text }) {
    return (
        <div style={{ display: 'flex', gap: 12, maxWidth: '88%', animation: 'fadeUp .4s both' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', fontSize: 11, flexShrink: 0, marginTop: 4, animation: 'pulse 2.5s infinite' }}>✦</div>
            <div>
                <div style={{ fontSize: 9, color: '#4a4550', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>CONCIERGE</div>
                <div style={{ background: 'var(--bg-elevated)', borderLeft: '2px solid var(--gold)', borderRadius: '0 16px 16px 16px', padding: '14px 18px', color: 'var(--cream)', fontSize: 14, lineHeight: 1.75 }}>{text}</div>
            </div>
        </div>
    );
}
