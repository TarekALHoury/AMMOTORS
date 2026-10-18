import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import CarFilters from './CarFilters.jsx';

const cars = [
  { make: 'Audi', model: 'Q5', year: 2024 },
  { make: 'BMW', model: 'M4', year: 2023 },
];

function FilterHarness() {
  const [filters, setFilters] = useState({ search: '', make: '', model: '' });
  return <CarFilters filters={filters} setFilters={setFilters} cars={cars} />;
}

test('uses styled dependent make and model filters without prices', async () => {
  const user = userEvent.setup();
  render(<FilterHarness />);
  const make = screen.getByRole('combobox', { name: 'Make' });
  await user.click(make);
  await user.type(screen.getByRole('searchbox', { name: 'Search Make' }), 'bmw');
  await user.click(screen.getByRole('option', { name: 'BMW' }));
  expect(make).toHaveTextContent('BMW');
  await user.click(screen.getByRole('combobox', { name: 'Model' }));
  expect(screen.getByRole('option', { name: 'M4' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Q5' })).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('combobox', { name: 'Price range' })).not.toBeInTheDocument();
});
