import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import About from './About.jsx';

test('shows the dealership map in the About panel', () => {
  const { container } = render(<About />);
  const map = screen.getByTitle('AM MOTORS dealership location');
  expect(map).toHaveAttribute('src', expect.stringContaining('q=33.8359833,35.5650153'));
  expect(container.querySelector('.about-visual')).toContainElement(map);
  expect(container.querySelector('.about-visual').children).toHaveLength(1);
});
