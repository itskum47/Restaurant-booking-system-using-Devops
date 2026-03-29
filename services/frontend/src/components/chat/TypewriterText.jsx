import useTypewriter from '../../hooks/useTypewriter';

function TypewriterText({ text, active = true, className = '' }) {
  const safeText = text ?? '';
  const { value, done } = useTypewriter(active ? safeText : '', 18, 15);
  const displayText = active ? value : safeText;
  const lines = displayText.split('\n');

  return (
    <p className={`${className} ${!done && active ? 'typewriter-cursor' : ''}`}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

export default TypewriterText;
