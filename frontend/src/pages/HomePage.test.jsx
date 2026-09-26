import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import HomePage from './HomePage.jsx';

const getCars = vi.hoisted(() => vi.fn());

vi.mock('../services/carsApi.js', () => ({ getCars }));
vi.mock('../components/Hero.jsx', () => ({ default: () => null }));
vi.mock('../components/About.jsx', () => ({ default: () => null }));
vi.mock('../components/Contact.jsx', () => ({ default: () => null }));
vi.mock('../components/CarGrid.jsx', () => ({
  default: ({ cars }) => <div data-testid="cars">{cars.map((car) => <span key={car.id}>{car.id}</span>)}</div>,
  CarGridSkeleton: () => <div>Loading cars</div>,
}));

test('shows six cars per page and keeps both page counts in sync', async () => {
  const user = userEvent.setup();
  getCars.mockResolvedValueOnce(Array.from({ length: 13 }, (_, index) => ({ id: `car-${index + 1}` })));
  render(<MemoryRouter><HomePage /></MemoryRouter>);

  expect(await screen.findAllByText('Page 1 of 3')).toHaveLength(2);
  expect(within(screen.getByTestId('cars')).getAllByText(/^car-/)).toHaveLength(6);
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getAllByText('Page 2 of 3')).toHaveLength(2);
  expect(within(screen.getByTestId('cars')).getAllByText(/^car-/)).toHaveLength(6);
  expect(within(screen.getByTestId('cars')).getByText('car-7')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getAllByText('Page 3 of 3')).toHaveLength(2);
  expect(within(screen.getByTestId('cars')).getByText('car-13')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
});
