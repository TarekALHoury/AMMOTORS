import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import CarDetailsPage from './CarDetailsPage.jsx';

const getCarById = vi.hoisted(() => vi.fn());

vi.mock('../services/carsApi.js', () => ({ getCarById }));

test('shows the year once in the compact vehicle summary with a bar separator', async () => {
  getCarById.mockResolvedValueOnce({
    id: 'gmc-yukon', make: 'GMC', model: 'Yukon', year: 2024,
    mileage: 100000, price: 90000, status: 'available', images: [],
  });

  const { container } = render(
    <MemoryRouter initialEntries={['/cars/gmc-yukon']}>
      <Routes><Route path="/cars/:id" element={<CarDetailsPage />} /></Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByRole('heading', { name: 'GMC Yukon' })).toBeInTheDocument();
  const summary = container.querySelector('.vehicle-summary');
  expect(summary.querySelectorAll('.vehicle-year')).toHaveLength(0);
  expect(summary.querySelector('.vehicle-meta').textContent).toBe('2024 | 100,000 km');
});

test('preserves the description line breaks entered in the admin form', async () => {
  const description = 'NAVIGATION\nCAMERA\nSENSOR\nPANORAMIC\nBLIND SPOT';
  getCarById.mockResolvedValueOnce({
    id: 'jaguar-f-pace', make: 'Jaguar', model: 'F-Pace', year: 2018,
    mileage: 65000, price: 1000, status: 'available', images: [], description,
  });

  const { container } = render(
    <MemoryRouter initialEntries={['/cars/jaguar-f-pace']}>
      <Routes><Route path="/cars/:id" element={<CarDetailsPage />} /></Routes>
    </MemoryRouter>,
  );

  await screen.findByRole('heading', { name: 'Jaguar F-Pace' });
  expect(container.querySelector('.vehicle-description').textContent).toBe(description);
});
