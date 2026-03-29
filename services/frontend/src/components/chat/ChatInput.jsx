import { useState } from 'react';

function ChatInput({ onSend, disabled = false }) {
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) {
      return;
    }

    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="glass-card mt-4 flex items-end gap-3 rounded-2xl border border-[var(--border-subtle)] p-3">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="Type or speak your request"
        rows={1}
        className="max-h-36 min-h-[42px] flex-1 resize-y rounded-xl border border-transparent bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--border-gold)] focus:shadow-[var(--glow-gold)]"
      />
      <button
        type="button"
        onClick={() => setRecording((state) => !state)}
        className={`h-11 w-11 rounded-full border ${recording ? 'animate-pulse border-[var(--accent-red)] text-[var(--accent-red)]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'} transition-all`}
        aria-label="Toggle microphone"
      >
        🎙
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="btn-gold flex h-11 w-11 items-center justify-center rounded-full p-0 text-lg transition-transform hover:rotate-45 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Send"
      >
        ↑
      </button>
    </div>
  );
}

export default ChatInput;
