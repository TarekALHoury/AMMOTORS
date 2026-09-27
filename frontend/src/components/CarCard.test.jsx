import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import CarCard from './CarCard.jsx';

test('separates the card year and mileage with a bar', () => {
  const { container } = render(
    <MemoryRouter>
      <CarCard car={{ id: 'yukon', make: 'GMC', model: 'Yukon', year: 2024, mileage: 100000, price: 90000, status: 'available', images: [] }} />
    </MemoryRouter>,
  );

  expect(container.querySelector('.car-meta').textContent).toBe('2024 | 100,000 km');
});
