function GhostButton({ children, className = '', ...props }) {
  const baseStyle = {
    background: 'rgba(12, 10, 16, 0.78)',
    border: '1px solid rgba(201,168,76,0.28)',
    color: '#f5ede0',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };

  return (
    <button className={className} style={baseStyle} {...props}>
      {children}
    </button>
  );
}

export default GhostButton;
