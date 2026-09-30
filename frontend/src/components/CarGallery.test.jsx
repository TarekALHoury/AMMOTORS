import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import CarGallery from './CarGallery.jsx';

const images = ['https://example.com/front.jpg', 'https://example.com/rear.jpg'];

afterEach(() => vi.useRealTimers());

test('automatically cycles multi-image galleries and wraps to the first image', () => {
  vi.useFakeTimers();
  const { container } = render(<CarGallery images={images} name="BMW M4" />);
  const track = container.querySelector('.gallery-main .gallery-image-track');

  act(() => vi.advanceTimersByTime(4500));
  expect(track).toHaveStyle({ transform: 'translate3d(-100%, 0, 0)' });
  act(() => vi.advanceTimersByTime(4500));
  expect(track).toHaveStyle({ transform: 'translate3d(-0%, 0, 0)' });
});

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

test.each([
  ['pinch out', 90, 270],
  ['pinch in', 270, 90],
])('does not change the enlarged photo during a %s gesture', (_, firstFingerEnd, secondFingerEnd) => {
  const { container } = render(<CarGallery images={images} name="BMW M4" />);
  fireEvent.click(screen.getByRole('button', { name: 'Enlarge BMW M4 image 1' }));
  const viewer = container.querySelector('.gallery-lightbox-image');

  fireEvent.touchStart(viewer, {
    touches: [
      { identifier: 1, clientX: 140, clientY: 200 },
      { identifier: 2, clientX: 220, clientY: 200 },
    ],
  });
  fireEvent.touchMove(viewer, {
    touches: [
      { identifier: 1, clientX: firstFingerEnd, clientY: 200 },
      { identifier: 2, clientX: secondFingerEnd, clientY: 200 },
    ],
  });
  fireEvent.touchEnd(viewer, {
    touches: [{ identifier: 2, clientX: secondFingerEnd, clientY: 200 }],
    changedTouches: [{ identifier: 1, clientX: firstFingerEnd, clientY: 200 }],
  });
  fireEvent.touchEnd(viewer, {
    touches: [],
    changedTouches: [{ identifier: 2, clientX: secondFingerEnd, clientY: 200 }],
  });

  expect(container.querySelector('.gallery-lightbox .gallery-image-track')).toHaveStyle({ transform: 'translate3d(-0%, 0, 0)' });
});
