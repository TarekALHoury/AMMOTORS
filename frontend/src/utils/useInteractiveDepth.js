import { useEffect } from 'react';

export function useInteractiveDepth() {
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (motionQuery.matches || !pointerQuery.matches) return undefined;

    let frame = 0;
    function update(event) {
      const target = event.target.closest?.('[data-tilt]');
      if (!target) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const strength = Number(target.dataset.tilt) || 5;
        const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        target.style.setProperty('--tilt-x', `${((.5 - y) * strength).toFixed(2)}deg`);
        target.style.setProperty('--tilt-y', `${((x - .5) * strength).toFixed(2)}deg`);
        target.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
        target.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
        target.classList.add('is-tilting');
      });
    }
    function reset(event) {
      const target = event.target.closest?.('[data-tilt]');
      if (!target || target.contains(event.relatedTarget)) return;
      target.classList.remove('is-tilting');
      target.style.removeProperty('--tilt-x');
      target.style.removeProperty('--tilt-y');
      target.style.removeProperty('--glow-x');
      target.style.removeProperty('--glow-y');
    }

    document.addEventListener('pointermove', update, { passive: true });
    document.addEventListener('pointerout', reset, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', update);
      document.removeEventListener('pointerout', reset);
    };
  }, []);
}
