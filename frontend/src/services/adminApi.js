import { firebaseAuth } from './firebaseAuth.js';

// This URL identifies the public Worker endpoint only. R2 credentials remain
// inside Cloudflare's R2 binding and are never available to the browser.
const defaultImageApiUrl = 'https://ammotors-image-api.ammotors-image-api.workers.dev';
const apiBaseUrl = (
  import.meta.env.VITE_IMAGE_API_URL
  || import.meta.env.VITE_API_BASE_URL
  || defaultImageApiUrl
).replace(/\/$/, '');

export async function adminApiRequest(path, { body, headers, ...options } = {}) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Administrator authentication expired. Please sign in again.');
  const token = await user.getIdToken();
  const isFormData = body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    body,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'The request could not be completed.');
  return payload;
}
