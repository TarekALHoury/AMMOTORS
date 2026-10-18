import { expect, test } from 'vitest';
import { formatMileage, kilometersToMiles, milesToKilometers } from './formatters.js';

test('formats stored kilometers as miles', () => {
  expect(formatMileage(12000)).toBe('7,456 mi');
  expect(formatMileage(64999)).toBe('40,389 mi');
});

test('converts mileage using the standard exact factor', () => {
  expect(milesToKilometers(100)).toBeCloseTo(160.9344, 4);
  expect(kilometersToMiles(160.9344)).toBeCloseTo(100, 6);
});

test('returns a safe label for missing or invalid mileage', () => {
  expect(formatMileage()).toBe('N/A');
  expect(formatMileage('not-a-number')).toBe('N/A');
});
