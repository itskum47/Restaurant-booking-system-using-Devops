import { useEffect } from 'react';

function useCursorGlow() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) {
      return undefined;
    }

    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');

    if (!cursor || !ring) {
      return undefined;
    }

    const onMove = (event) => {
      const { clientX, clientY } = event;
      cursor.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
    };

    const onHoverStart = () => {
      ring.style.width = '50px';
      ring.style.height = '50px';
      ring.style.borderColor = 'rgba(201, 168, 76, 0.9)';
    };

    const onHoverEnd = () => {
      ring.style.width = '32px';
      ring.style.height = '32px';
      ring.style.borderColor = 'rgba(201, 168, 76, 0.4)';
    };

    const hoverables = Array.from(document.querySelectorAll('a, button, input, textarea, [role="button"], .hoverable'));

    document.addEventListener('mousemove', onMove);
    hoverables.forEach((element) => {
      element.addEventListener('mouseenter', onHoverStart);
      element.addEventListener('mouseleave', onHoverEnd);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
      hoverables.forEach((element) => {
        element.removeEventListener('mouseenter', onHoverStart);
        element.removeEventListener('mouseleave', onHoverEnd);
      });
    };
  });
}

export default useCursorGlow;
