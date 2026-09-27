import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import CarGallery from './CarGallery.jsx';

const images = ['https://example.com/front.jpg', 'https://example.com/rear.jpg'];

test('switches the main image from the thumbnail previews', () => {
  render(<CarGallery images={images} name="BMW M4" />);

  fireEvent.click(screen.getByRole('button', { name: 'Show BMW M4 image 2' }));

  expect(screen.getByAltText('BMW M4 view 2')).toHaveAttribute('src', images[1]);
  expect(screen.getByRole('button', { name: 'Show BMW M4 image 2' })).toHaveAttribute('aria-pressed', 'true');
});

test('opens an enlarged viewer and supports keyboard navigation', () => {
  render(<CarGallery images={images} name="BMW M4" />);

  fireEvent.click(screen.getByRole('button', { name: 'Enlarge BMW M4 image 1' }));
  expect(screen.getByRole('dialog', { name: 'BMW M4 enlarged image' })).toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(screen.getByAltText('BMW M4 enlarged view 2')).toHaveAttribute('src', images[1]);

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('changes the main photo with a horizontal swipe without opening the viewer', () => {
  render(<CarGallery images={images} name="BMW M4" />);
  const imageButton = screen.getByRole('button', { name: 'Enlarge BMW M4 image 1' });

  fireEvent.touchStart(imageButton, { touches: [{ clientX: 240 }] });
  fireEvent.touchEnd(imageButton, { changedTouches: [{ clientX: 120 }] });
  fireEvent.click(imageButton);

  expect(screen.getByAltText('BMW M4 view 2')).toHaveAttribute('src', images[1]);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
