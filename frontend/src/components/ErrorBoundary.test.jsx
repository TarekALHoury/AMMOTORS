import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary.jsx';

function BrokenView() {
  throw new Error('render failed');
}

afterEach(() => vi.restoreAllMocks());

test('shows a recoverable fallback when a child fails to render', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const suppressExpectedError = (event) => event.preventDefault();
  window.addEventListener('error', suppressExpectedError);
  render(<ErrorBoundary><BrokenView /></ErrorBoundary>);
  window.removeEventListener('error', suppressExpectedError);

  expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t display this page');
  expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
});
