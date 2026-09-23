import { render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useInteractiveDepth } from './useInteractiveDepth.js';

function Harness() {
  useInteractiveDepth();
  return <article data-tilt="8">Card</article>;
}

describe('useInteractiveDepth', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  test('updates and resets pointer-driven tilt variables', () => {
    vi.stubGlobal('matchMedia', vi.fn((query) => ({ matches: query.includes('pointer: fine'), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callback(); return 1; });
    const { getByText } = render(<Harness />);
    const card = getByText('Card');
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 100 });

    card.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 200, clientY: 0 }));
    expect(card).toHaveClass('is-tilting');
    expect(card.style.getPropertyValue('--tilt-x')).toBe('4.00deg');
    expect(card.style.getPropertyValue('--tilt-y')).toBe('4.00deg');

    card.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
    expect(card).not.toHaveClass('is-tilting');
  });
});
