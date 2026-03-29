import AIThinkingDots from '../ui/AIThinkingDots';
import TypewriterText from './TypewriterText';

function ChatBubble({ role, content, typing = false }) {
  const isAI = role === 'assistant';
  const safeContent = content ?? '';

  return (
    <div className={`${isAI ? 'bubble-ai' : 'bubble-user'}`}>
      <div className="mb-2 text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">{isAI ? '🤖 Concierge' : '👤 You'}</div>
      {typing ? (
        <AIThinkingDots />
      ) : isAI ? (
        <TypewriterText text={safeContent} className="text-sm leading-relaxed text-[var(--text-primary)]" />
      ) : (
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">{safeContent}</p>
      )}
    </div>
  );
}

export default ChatBubble;
