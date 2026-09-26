import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import Navbar from './Navbar.jsx';

afterEach(() => vi.restoreAllMocks());

test('highlights Available Cars on the inventory route', () => {
  render(<MemoryRouter initialEntries={['/cars']}><Navbar /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Available Cars' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('active');
});

test('tracks the homepage section while scrolling', async () => {
  const sectionTops = { 'latest-cars': 600, about: 1200, contact: 1800 };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function getRect() {
    return { top: sectionTops[this.id] ?? 0, height: 76, width: 100, left: 0, right: 100, bottom: 76 };
  });
  render(<MemoryRouter><Navbar /><section id="latest-cars" /><section id="about" /><section id="contact" /></MemoryRouter>);

  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'location');
  sectionTops['latest-cars'] = 100;
  fireEvent.scroll(window);
  await waitFor(() => expect(screen.getByRole('link', { name: 'Available Cars' })).toHaveAttribute('aria-current', 'location'));

  sectionTops.about = 100;
  fireEvent.scroll(window);
  await waitFor(() => expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'location'));

  sectionTops.contact = 100;
  fireEvent.scroll(window);
  await waitFor(() => expect(document.querySelector('.nav-link[href="/#contact"]')).toHaveAttribute('aria-current', 'location'));
});
