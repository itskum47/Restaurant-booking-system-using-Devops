import { useEffect, useRef, useState } from 'react';

function useScrollAnimation(options = { threshold: 0.2, triggerOnce: true }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!options.triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold: options.threshold ?? 0.2 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [options.threshold, options.triggerOnce]);

  return { ref, isVisible };
}

export default useScrollAnimation;
