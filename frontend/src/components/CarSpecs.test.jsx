import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CarSpecs from './CarSpecs.jsx';

describe('CarSpecs', () => {
  test('uses the real engine asset for the public engine specification', () => {
    const { container } = render(<CarSpecs car={{ year: 2024, engine: '3.0L Twin-Turbo' }} />);
    const engineLabel = screen.getByText('Engine');
    const engineIcon = engineLabel.closest('.spec').querySelector('.spec-icon');

    expect(engineIcon).toHaveAttribute('data-icon', 'engine');
    expect(engineIcon.getAttribute('src')).toContain('lucide-engine');
  });
});
