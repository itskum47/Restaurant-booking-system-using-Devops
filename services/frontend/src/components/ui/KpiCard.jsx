export default function KpiCard({ label, value, sub, trend, color, icon, bar, delay = 0 }) {
    return (
        <div style={{
            background: 'var(--o-card)',
            border: '1px solid var(--o-border)',
            borderRadius: 12, padding: 20,
            position: 'relative', overflow: 'hidden',
            animation: `fadeUp 0.5s ${delay}s both`,
        }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${color}18,transparent)` }} />
            <div style={{ fontSize: 22, marginBottom: 14 }}>{icon}</div>
            <div style={{ color: 'var(--o-muted)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, color, lineHeight: 1, marginBottom: 4 }}>
                {value}
                {sub && <span style={{ fontSize: 11, color: 'var(--o-muted)', fontFamily: 'var(--font-body)', marginLeft: 6 }}>{sub}</span>}
            </div>
            <div style={{ color: 'var(--o-green)', fontSize: 11, marginBottom: 14 }}>{trend}</div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${bar}%`, background: color, borderRadius: 1, transition: 'width 1.2s ease' }} />
            </div>
        </div>
    );
}
