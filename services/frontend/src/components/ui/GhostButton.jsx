function GhostButton({ children, className = '', ...props }) {
  return (
    <button className={`btn-ghost ${className}`} {...props}>
      {children}
    </button>
  );
}

export default GhostButton;
