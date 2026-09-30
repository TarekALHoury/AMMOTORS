import { expect, test } from 'vitest';
import { formatMileage, formatPrice } from './formatters.js';

test('formats prices and valid mileage values', () => {
  expect(formatPrice(90000)).toBe('$90,000');
  expect(formatMileage(12000)).toBe('12,000 km | 7,456 mi');
  expect(formatMileage(64999)).toBe('64,999 km | 40,388 mi');
});

test('returns a safe label for missing or invalid mileage', () => {
  expect(formatMileage()).toBe('N/A');
  expect(formatMileage('not-a-number')).toBe('N/A');
});
