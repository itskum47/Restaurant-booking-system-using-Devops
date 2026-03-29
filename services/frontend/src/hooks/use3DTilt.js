import { useEffect, useRef } from 'react';

function use3DTilt(maxTilt = 8) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(hover: none)').matches) {
      return undefined;
    }

    const onMove = (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;
      element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02) translateY(-4px)`;
    };

    const reset = () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)';
    };

    element.addEventListener('mousemove', onMove);
    element.addEventListener('mouseleave', reset);

    return () => {
      element.removeEventListener('mousemove', onMove);
      element.removeEventListener('mouseleave', reset);
    };
  }, [maxTilt]);

  return ref;
}

export default use3DTilt;
