import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
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
});
