const COLORS = {
  confirmed: { bg: 'rgba(72,187,120,0.09)', border: 'rgba(72,187,120,0.25)', text: '#48bb78' },
  pending: { bg: 'rgba(246,173,85,0.09)', border: 'rgba(246,173,85,0.25)', text: '#f6ad55' },
  cancelled: { bg: 'rgba(252,129,129,0.09)', border: 'rgba(252,129,129,0.25)', text: '#fc8181' },
};
export default function StatusBadge({ status }) {
  const c = COLORS[status] || COLORS.pending;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}
