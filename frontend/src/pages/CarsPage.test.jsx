import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import CarsPage from './CarsPage.jsx';

const getCars = vi.hoisted(() => vi.fn());

vi.mock('../services/carsApi.js', () => ({ getCars }));
vi.mock('../components/CarGrid.jsx', () => ({
  default: ({ cars }) => <div data-testid="cars">{cars.map((car) => <span key={car.id}>{car.id}</span>)}</div>,
  CarGridSkeleton: () => <div>Loading cars</div>,
}));

test('paginates available cars and resets to the first page when filters change', async () => {
  const user = userEvent.setup();
  getCars.mockResolvedValueOnce(Array.from({ length: 13 }, (_, index) => ({
    id: `car-${index + 1}`,
    make: index < 9 ? 'BMW' : 'Mercedes',
    model: 'Sedan',
    year: 2024,
    price: 50000,
  })));
  render(<CarsPage />);

  expect(await screen.findAllByText('Page 1 of 3')).toHaveLength(2);
  expect(within(screen.getByTestId('cars')).getAllByText(/^car-/)).toHaveLength(6);
  expect(screen.getByText('13 vehicles available')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getAllByText('Page 2 of 3')).toHaveLength(2);
  expect(within(screen.getByTestId('cars')).getByText('car-7')).toBeInTheDocument();

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Mercedes');
  expect(screen.getAllByText('Page 1 of 1')).toHaveLength(2);
  expect(screen.getByText('4 vehicles available')).toBeInTheDocument();
  expect(within(screen.getByTestId('cars')).getAllByText(/^car-/)).toHaveLength(4);
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
});
