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

  test('searches and filters inventory', async () => {
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user);
    await user.click(screen.getByRole('button', { name: /Inventory 3/i }));
    await user.type(screen.getByPlaceholderText('Search make, model, or year'), 'Audi');
    expect(screen.getByText('Audi Q5 Premium Plus')).toBeInTheDocument();
    expect(screen.queryByText('BMW M4 Competition')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'sold');
    expect(screen.getByText('Audi Q5 Premium Plus')).toBeInTheDocument();
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
    await user.selectOptions(make, 'BMW');
    expect(model).toBeEnabled();
    expect(within(model).getByRole('option', { name: 'M4 Competition' })).toBeInTheDocument();
    expect(within(model).queryByRole('option', { name: 'C300' })).not.toBeInTheDocument();
    await user.selectOptions(model, 'M4 Competition');
    await user.selectOptions(make, 'Audi');
    expect(model).toHaveValue('');
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
