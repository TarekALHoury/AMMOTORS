import { expect, test } from 'vitest';
import { formatMileage, formatMileageWithMiles, formatPrice, kilometersToMiles, milesToKilometers } from './formatters.js';

test('formats prices and valid mileage values', () => {
  expect(formatPrice(90000)).toBe('$90,000');
  expect(formatMileage(12000)).toBe('12,000 km');
  expect(formatMileageWithMiles(64999)).toBe('64,999 km | 40,389 mi');
});

test('converts mileage using the standard exact factor', () => {
  expect(milesToKilometers(100)).toBeCloseTo(160.9344, 4);
  expect(kilometersToMiles(160.9344)).toBeCloseTo(100, 6);
});

test('returns a safe label for missing or invalid mileage', () => {
  expect(formatMileage()).toBe('N/A');
  expect(formatMileage('not-a-number')).toBe('N/A');
  expect(formatMileageWithMiles()).toBe('N/A');
});
