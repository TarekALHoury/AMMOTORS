import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AdminPage, { demoCars } from './AdminPage.jsx';
import { getCars } from '../services/carsApi.js';
import { observeAdminAuth, signInAdmin, signOutAdmin } from '../services/adminAuth.js';

vi.mock('../services/carsApi.js', () => ({ getCars: vi.fn() }));
vi.mock('../services/adminAuth.js', () => ({
  observeAdminAuth: vi.fn(),
  signInAdmin: vi.fn(),
  signOutAdmin: vi.fn(),
}));

function renderAdmin() {
  return render(<MemoryRouter><AdminPage /></MemoryRouter>);
}

async function signIn(user) {
  await user.type(screen.getByLabelText('Email address'), 'admin@example.com');
  await user.type(screen.getByLabelText('Password'), 'secure-password{Enter}');
  await screen.findByRole('heading', { name: 'Dashboard' });
}

async function chooseFormOption(user, label, option) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
}

describe('admin dashboard UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCars.mockResolvedValue(demoCars);
    observeAdminAuth.mockImplementation((onUser) => {
      onUser(null);
      return vi.fn();
    });
    signInAdmin.mockResolvedValue({ email: 'admin@example.com' });
    signOutAdmin.mockResolvedValue();
  });

  test('shows accessible sign-in validation before authentication', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must contain at least 6 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  test('supports keyboard sign-in and loads the existing inventory contract', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    expect(getCars).toHaveBeenCalledOnce();
    expect(screen.getByText('Total inventory').nextSibling).toHaveTextContent('3');
    expect(screen.getAllByText('BMW M4 Competition').length).toBeGreaterThan(0);
  });

  test('searches every vehicle detail and combines advanced inventory filters', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(screen.getByRole('button', { name: /Inventory 3/i }));
    const search = screen.getByPlaceholderText('Search all vehicle details');
    await user.type(search, 'refined practical');
    expect(screen.getByText('Audi Q5 Premium Plus')).toBeInTheDocument();
    expect(screen.queryByText('BMW M4 Competition')).not.toBeInTheDocument();
    await user.clear(search);
    await user.click(screen.getByText(/^Advanced filters/));
    await user.selectOptions(screen.getByLabelText('Filter by make'), 'BMW');
    expect(screen.getByText('BMW M4 Competition')).toBeInTheDocument();
    expect(screen.queryByText('Audi Q5 Premium Plus')).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Filter by model')).getByRole('option', { name: 'M4 Competition' })).toBeInTheDocument();
    expect(within(screen.getByLabelText('Filter by model')).queryByRole('option', { name: 'C300' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by drivetrain'), 'RWD');
    await user.selectOptions(screen.getByLabelText('Filter by exterior color'), 'Black');
    await user.type(screen.getByLabelText('Minimum horsepower'), '500');
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'sold');
    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
    await user.click(within(document.querySelector('.admin-empty')).getByRole('button', { name: 'Clear all filters' }));
    expect(screen.getByText('Audi Q5 Premium Plus')).toBeInTheDocument();
    expect(screen.getByText('BMW M4 Competition')).toBeInTheDocument();
  });

  test('focuses and reports validation errors on an empty add-car form', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(within(screen.getByRole('navigation', { name: 'Admin navigation' })).getByRole('button', { name: /Add vehicle/i }));
    const form = document.querySelector('.admin-car-form');
    await user.click(within(form).getByRole('button', { name: 'Add vehicle' }));
    expect(await screen.findAllByText('Required.')).not.toHaveLength(0);
    expect(screen.getByLabelText('Make *')).toHaveFocus();
  });

  test('filters model choices by make and keeps select controls keyboard accessible', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(within(screen.getByRole('navigation', { name: 'Admin navigation' })).getByRole('button', { name: /Add vehicle/i }));
    const make = screen.getByLabelText('Make *');
    const model = screen.getByLabelText('Model *');
    expect(make).toHaveRole('combobox');
    expect(model).toBeDisabled();
    expect(screen.queryByRole('option', { name: /Other/ })).not.toBeInTheDocument();
    await user.click(make);
    expect(screen.getAllByRole('option').length).toBeGreaterThan(70);
    expect(screen.getByRole('option', { name: 'Ferrari' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'VinFast' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'BMW' }));
    expect(model).toBeEnabled();
    await user.click(model);
    expect(screen.getByRole('option', { name: 'M4 Competition' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'C300' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'M4 Competition' }));
    expect(screen.getByLabelText('Engine *')).toBeEnabled();
    await chooseFormOption(user, 'Engine *', '3.0L Twin-Turbo');
    expect(screen.getByRole('combobox', { name: 'Engine *' })).toHaveTextContent('3.0L Twin-Turbo');
    await chooseFormOption(user, 'Make *', 'Audi');
    expect(model).toHaveTextContent('Select a model');
    expect(screen.getByLabelText('Engine *')).toBeDisabled();
    expect(screen.getByLabelText('Year *')).toHaveRole('combobox');
    expect(screen.getByLabelText('Fuel type *')).toHaveRole('combobox');
    await user.click(screen.getByLabelText('Transmission *'));
    expect(screen.getByRole('option', { name: 'Automated Manual Transmission (AMT)' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByLabelText('Fuel type *'));
    expect(screen.getByRole('option', { name: 'Self-charging Hybrid (HEV)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Plug-in Hybrid (PHEV)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fully Electric (BEV)' })).toBeInTheDocument();
  });

  test('restricts mileage to non-negative whole numbers and requests a mobile number keypad', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(within(screen.getByRole('navigation', { name: 'Admin navigation' })).getByRole('button', { name: /Add vehicle/i }));
    const mileage = screen.getByLabelText('Mileage (km) *');
    expect(mileage).toHaveAttribute('type', 'number');
    expect(mileage).toHaveAttribute('inputmode', 'numeric');
    expect(mileage).toHaveAttribute('min', '0');
    expect(mileage).toHaveAttribute('step', '1');
    await user.type(mileage, '12000');
    expect(mileage).toHaveValue(12000);
    await user.type(mileage, '.e-+abc');
    expect(mileage).toHaveValue(12000);
    expect(fireEvent.paste(mileage, { clipboardData: { getData: () => '-12.5' } })).toBe(false);
    expect(mileage).toHaveValue(12000);
  });

  test('supports keyboard-only selection in styled form dropdowns', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(within(screen.getByRole('navigation', { name: 'Admin navigation' })).getByRole('button', { name: /Add vehicle/i }));
    const make = screen.getByRole('combobox', { name: 'Make *' });
    make.focus();
    await user.keyboard('{Enter}{ArrowDown}{Enter}');
    expect(make).toHaveTextContent('Acura');
    expect(make).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('combobox', { name: 'Model *' })).toBeEnabled();
  });

  test('searches the make dropdown and selects from filtered brands', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(within(screen.getByRole('navigation', { name: 'Admin navigation' })).getByRole('button', { name: /Add vehicle/i }));
    const make = screen.getByRole('combobox', { name: 'Make *' });
    await user.click(make);
    const makeSearch = screen.getByRole('searchbox', { name: 'Search Make' });
    expect(makeSearch).toHaveFocus();
    await user.type(makeSearch, 'land rover');
    expect(screen.getByRole('option', { name: 'Land Rover' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'BMW' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Land Rover' }));
    expect(make).toHaveTextContent('Land Rover');
    expect(make).toHaveAttribute('aria-expanded', 'false');
  });

  test('exposes a keyboard-operable mobile navigation drawer', async () => {
    const user = userEvent.setup();
    const { container } = renderAdmin();
    await signIn(user);
    const toggle = screen.getByRole('button', { name: 'Toggle admin navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.admin-sidebar')).toHaveClass('open');
    await user.click(screen.getByRole('button', { name: 'Close admin navigation' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.admin-sidebar')).not.toHaveClass('open');
  });

  test('requires confirmation before deleting a vehicle', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(screen.getByRole('button', { name: /Inventory 3/i }));
    await user.click(screen.getByRole('button', { name: 'Delete BMW M4 Competition' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Delete this vehicle?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('BMW M4 Competition')).toBeInTheDocument();
  });
});
