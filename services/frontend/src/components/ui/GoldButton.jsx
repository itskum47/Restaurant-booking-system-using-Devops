export default function GoldButton({ children, onClick, disabled, fullWidth, size = 'md' }) {
  const padding = size === 'lg' ? '15px 32px' : size === 'sm' ? '8px 18px' : '12px 26px';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: fullWidth ? '100%' : 'auto',
      padding,
      background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#c9a84c,#f0c96a)',
      border: 'none', borderRadius: 8,
      color: disabled ? '#2a2530' : '#060507',
      fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all .3s',
      boxShadow: disabled ? 'none' : '0 6px 24px rgba(201,168,76,0.25)',
      animation: disabled ? 'none' : 'glow 3s ease-in-out infinite',
    }}>
      {children}
    </button>
  );
}
