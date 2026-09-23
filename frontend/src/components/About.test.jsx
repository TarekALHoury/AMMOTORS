import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import About from './About.jsx';

test('uses the metallic AM logo in the responsive About panel', () => {
  const { container } = render(<About />);
  const logo = screen.getByRole('img', { name: 'AM Motors metallic logo' });
  expect(logo).toHaveClass('about-brand-mark');
  expect(logo.getAttribute('src')).toContain('am-mark-metallic.png');
  expect(container.querySelector('.about-visual')).toContainElement(logo);
  expect(screen.getByText('Driven by quality')).toBeInTheDocument();
});
