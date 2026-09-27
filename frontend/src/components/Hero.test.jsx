import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import Hero from './Hero.jsx';

describe('Hero', () => {
  test('keeps the existing desktop hero and adds a contained mobile sequence', () => {
    const { container } = render(<MemoryRouter><Hero /></MemoryRouter>);
    expect(container.querySelector('.hero-depth-orbit')).toBeNull();
    expect(container.querySelectorAll('.hero-content .benefit[data-tilt="5"]')).toHaveLength(4);
    expect(container.querySelectorAll('.mobile-cinematic-hero .benefit[data-tilt="5"]')).toHaveLength(4);
    expect(container.querySelector('.mobile-cinematic-frame')).toBeInTheDocument();
    expect(container.querySelector('.mobile-cinematic-photo')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.mobile-cinematic-photo').tagName).toBe('IMG');
    expect(container.querySelector('.mobile-cinematic-photo')).toHaveAttribute('fetchpriority', 'high');
    expect(container.querySelector('.mobile-cinematic-tree')).toBeNull();
    expect(container.querySelector('.mobile-cinematic-intro h1')).toHaveTextContent('Find yournext drive');
  });

  test('keeps its captured mobile viewport when browser chrome changes only the height', async () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    window.matchMedia = vi.fn((query) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { container, unmount } = render(<MemoryRouter><Hero /></MemoryRouter>);
    const hero = container.querySelector('.hero');
    expect(hero.style.getPropertyValue('--stable-mobile-viewport-height')).toBe('844px');
    expect(hero.style.getPropertyValue('--stable-mobile-scroll-height')).toBe('2532px');
    expect(hero.style.getPropertyValue('--stable-mobile-intro-offset')).toBe('101.28px');

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 680 });
    fireEvent(window, new Event('resize'));
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    expect(hero.style.getPropertyValue('--stable-mobile-viewport-height')).toBe('844px');
    expect(hero.style.getPropertyValue('--stable-mobile-scroll-height')).toBe('2532px');
    expect(hero.style.getPropertyValue('--stable-mobile-intro-offset')).toBe('101.28px');

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
    fireEvent(window, new Event('resize'));
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    expect(hero.style.getPropertyValue('--stable-mobile-viewport-height')).toBe('390px');
    expect(hero.style.getPropertyValue('--stable-mobile-scroll-height')).toBe('1170px');
    expect(hero.style.getPropertyValue('--stable-mobile-intro-offset')).toBe('78px');

    unmount();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
    window.matchMedia = originalMatchMedia;
  });
});
