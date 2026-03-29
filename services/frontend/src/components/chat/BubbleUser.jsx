export default function BubbleUser({ text }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fadeUp .4s both' }}>
            <div style={{ background: 'linear-gradient(135deg,#2d150a,#4a2010)', border: '1px solid rgba(232,96,44,0.18)', borderRadius: '16px 0 16px 16px', padding: '14px 18px', color: 'var(--cream)', fontSize: 14, lineHeight: 1.65, maxWidth: '76%' }}>{text}</div>
        </div>
    );
}
