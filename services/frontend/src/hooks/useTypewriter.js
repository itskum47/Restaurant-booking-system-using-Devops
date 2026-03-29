import { useEffect, useMemo, useState } from 'react';

function useTypewriter(text, speed = 18, jitter = 15) {
  const normalizedText = useMemo(() => text || '', [text]);
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let timeoutId;

    setValue('');
    setDone(false);

    if (!normalizedText.length) {
      setDone(true);
      return undefined;
    }

    const tick = () => {
      if (index >= normalizedText.length) {
        setDone(true);
        return;
      }

      setValue(normalizedText.slice(0, index + 1));
      index += 1;
      timeoutId = setTimeout(tick, speed + Math.random() * jitter);
    };

    tick();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [normalizedText, speed, jitter]);

  return { value, done };
}

export default useTypewriter;
