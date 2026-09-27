import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import CarGallery from './CarGallery.jsx';

const images = ['https://example.com/front.jpg', 'https://example.com/rear.jpg'];

test('switches the main image from the thumbnail previews', () => {
  const { container } = render(<CarGallery images={images} name="BMW M4" />);

  fireEvent.click(screen.getByRole('button', { name: 'Show BMW M4 image 2' }));

  expect(container.querySelector('.gallery-main .gallery-image-track')).toHaveStyle({ transform: 'translate3d(-100%, 0, 0)' });
  expect(screen.getByRole('button', { name: 'Show BMW M4 image 2' })).toHaveAttribute('aria-pressed', 'true');
});

test('opens an enlarged viewer and supports keyboard navigation', () => {
  const { container } = render(<CarGallery images={images} name="BMW M4" />);

  fireEvent.click(screen.getByRole('button', { name: 'Enlarge BMW M4 image 1' }));
  expect(screen.getByRole('dialog', { name: 'BMW M4 enlarged image' })).toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(container.querySelector('.gallery-lightbox .gallery-image-track')).toHaveStyle({ transform: 'translate3d(-100%, 0, 0)' });

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('changes the main photo with a horizontal swipe without opening the viewer', () => {
  const { container } = render(<CarGallery images={images} name="BMW M4" />);
  const imageButton = screen.getByRole('button', { name: 'Enlarge BMW M4 image 1' });

  fireEvent.touchStart(imageButton, { touches: [{ clientX: 240 }] });
  fireEvent.touchEnd(imageButton, { changedTouches: [{ clientX: 120 }] });
  fireEvent.click(imageButton);

  expect(container.querySelector('.gallery-main .gallery-image-track')).toHaveStyle({ transform: 'translate3d(-100%, 0, 0)' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
