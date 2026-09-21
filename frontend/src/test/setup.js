import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

window.scrollTo = vi.fn();
window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
URL.createObjectURL = vi.fn(() => 'blob:vehicle-preview');

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; };
}
