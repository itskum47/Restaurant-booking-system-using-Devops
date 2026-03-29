export default function TypingDots() {
    return (
        <div style={{ display: 'flex', gap: 12, animation: 'fadeUp .4s both' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', fontSize: 11 }}>✦</div>
            <div style={{ background: 'var(--bg-elevated)', borderLeft: '2px solid var(--gold)', borderRadius: '0 16px 16px 16px', padding: '16px 20px', display: 'flex', gap: 7, alignItems: 'center' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: `pulse 1.2s ${i * .22}s infinite` }} />)}
            </div>
        </div>
    );
}
