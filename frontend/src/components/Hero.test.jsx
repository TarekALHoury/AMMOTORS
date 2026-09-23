import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import Hero from './Hero.jsx';

describe('Hero', () => {
  test('includes decorative depth layers without exposing them to assistive technology', () => {
    const { container } = render(<MemoryRouter><Hero /></MemoryRouter>);
    const orbit = container.querySelector('.hero-depth-orbit');
    expect(orbit).toHaveAttribute('aria-hidden', 'true');
    expect(orbit.children).toHaveLength(3);
    expect(container.querySelectorAll('.benefit[data-tilt="5"]')).toHaveLength(4);
  });
});
