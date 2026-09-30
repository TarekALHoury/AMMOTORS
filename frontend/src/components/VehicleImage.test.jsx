import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
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
  expect(screen.getByAltText('BMW M4')).toHaveAttribute('src', 'https://example.com/missing.jpg?ammotors_retry=1');
  fireEvent.error(screen.getByAltText('BMW M4'));
  expect(screen.getByAltText('Image unavailable')).toBeInTheDocument();
});

test('does not replace a slow or lazy image on an arbitrary timer', () => {
  vi.useFakeTimers();
  render(<VehicleImage src="https://example.com/slow-car.jpg" alt="Slow car" />);

  vi.advanceTimersByTime(30_000);

  expect(screen.getByAltText('Slow car')).toHaveAttribute('src', 'https://example.com/slow-car.jpg');
  vi.useRealTimers();
});
