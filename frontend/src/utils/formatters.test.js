import { expect, test } from 'vitest';
import { formatMileage, formatPrice } from './formatters.js';

test('formats prices and valid mileage values', () => {
  expect(formatPrice(90000)).toBe('$90,000');
  expect(formatMileage(12000)).toBe('12,000 km');
});

test('returns a safe label for missing or invalid mileage', () => {
  expect(formatMileage()).toBe('N/A');
  expect(formatMileage('not-a-number')).toBe('N/A');
});
