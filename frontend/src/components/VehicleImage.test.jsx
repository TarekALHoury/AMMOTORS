import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import VehicleImage from './VehicleImage.jsx';

test('adds non-blocking image attributes and preserves the vehicle description', () => {
  render(<VehicleImage src="https://example.com/car.jpg" alt="BMW M4" />);
  const image = screen.getByAltText('BMW M4');
  expect(image).toHaveAttribute('loading', 'lazy');
  expect(image).toHaveAttribute('decoding', 'async');
  expect(image).toHaveAttribute('width', '1200');
  expect(image).toHaveAttribute('height', '750');
});

test('announces an unavailable image when loading fails', () => {
  render(<VehicleImage src="https://example.com/missing.jpg" alt="BMW M4" />);
  fireEvent.error(screen.getByAltText('BMW M4'));
  expect(screen.getByAltText('Image unavailable')).toBeInTheDocument();
});
