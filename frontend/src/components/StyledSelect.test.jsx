import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import StyledSelect from './StyledSelect.jsx';

const options = [
  { value: '', label: 'All makes' },
  { value: 'BMW', label: 'BMW' },
  { value: 'Land Rover', label: 'Land Rover' },
];

test('filters, selects, and keyboard-operates public dropdown options', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<StyledSelect label="Make" name="make" value="" options={options} onChange={onChange} searchable />);
  const trigger = screen.getByRole('combobox', { name: 'Make' });
  await user.click(trigger);
  const search = screen.getByRole('searchbox', { name: 'Search Make' });
  expect(search).toHaveFocus();
  await user.type(search, 'land rover');
  expect(screen.getByRole('option', { name: 'Land Rover' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'BMW' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'Land Rover' }));
  expect(onChange).toHaveBeenCalledWith({ target: { name: 'make', value: 'Land Rover' } });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
