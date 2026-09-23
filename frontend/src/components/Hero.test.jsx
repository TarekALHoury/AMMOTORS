import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import Hero from './Hero.jsx';

describe('Hero', () => {
  test('renders hero benefits without decorative orbit rings', () => {
    const { container } = render(<MemoryRouter><Hero /></MemoryRouter>);
    expect(container.querySelector('.hero-depth-orbit')).toBeNull();
    expect(container.querySelectorAll('.benefit[data-tilt="5"]')).toHaveLength(4);
  });
});
