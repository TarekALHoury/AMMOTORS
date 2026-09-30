import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const carIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== env.ALLOWED_ORIGIN) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, env, value, status = 200) {
  return Response.json(value, { status, headers: corsHeaders(request, env) });
}

function validImageBytes(bytes, type) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === 'image/webp') return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

async function requireAdmin(request, env) {
  const match = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Response(JSON.stringify({ message: 'Authentication required.' }), { status: 401 });
  try {
    const { payload } = await jwtVerify(match[1], FIREBASE_JWKS, {
      audience: env.FIREBASE_PROJECT_ID,
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      algorithms: ['RS256'],
    });
    if (payload.admin !== true) throw new Response(JSON.stringify({ message: 'Admin access required.' }), { status: 403 });
    return payload;
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response(JSON.stringify({ message: 'Invalid or expired authentication token.' }), { status: 401 });
  }
}

function imageKey(carId, extension) {
  return `cars/${carId}/image-${crypto.randomUUID()}.${extension}`;
}

async function uploadImage(request, env) {
  await requireAdmin(request, env);
  const form = await request.formData();
  const carId = form.get('carId');
  const image = form.get('image');
  if (!carIdPattern.test(carId || '')) return json(request, env, { message: 'Invalid car ID.' }, 400);
  if (!(image instanceof File) || !IMAGE_TYPES.has(image.type)) {
    return json(request, env, { message: 'Upload a JPEG, PNG, or WebP image.' }, 400);
  }
  if (image.size <= 0 || image.size > MAX_IMAGE_BYTES) {
    return json(request, env, { message: 'Image files must be 10 MB or smaller.' }, 413);
  }
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!validImageBytes(bytes, image.type)) {
    return json(request, env, { message: 'The uploaded file is not a valid image.' }, 400);
  }
  const key = imageKey(carId, IMAGE_TYPES.get(image.type));
  await env.AMMOTORS_IMAGES.put(key, bytes, {
    httpMetadata: { contentType: image.type },
    customMetadata: { carId },
  });
  const url = `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  return json(request, env, { url, key }, 201);
}

async function deleteOneImage(request, env) {
  await requireAdmin(request, env);
  const { carId, key } = await request.json().catch(() => ({}));
  if (!carIdPattern.test(carId || '') || typeof key !== 'string' || !key.startsWith(`cars/${carId}/`)) {
    return json(request, env, { message: 'Invalid car image key.' }, 400);
  }
  await env.AMMOTORS_IMAGES.delete(key);
  return json(request, env, { deleted: true, key });
}

async function deleteCarImages(request, env) {
  await requireAdmin(request, env);
  const { carId } = await request.json().catch(() => ({}));
  if (!carIdPattern.test(carId || '')) return json(request, env, { message: 'Invalid car ID.' }, 400);
  const prefix = `cars/${carId}/`;
  let cursor;
  let deleted = 0;
  do {
    const page = await env.AMMOTORS_IMAGES.list({ prefix, cursor });
    await Promise.all(page.objects.map((object) => env.AMMOTORS_IMAGES.delete(object.key)));
    deleted += page.objects.length;
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return json(request, env, { deleted });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    try {
      if (request.method === 'POST' && url.pathname === '/api/upload-car-image') return uploadImage(request, env);
      if (request.method === 'DELETE' && url.pathname === '/api/delete-car-image') return deleteOneImage(request, env);
      if (request.method === 'DELETE' && url.pathname === '/api/delete-car-images') return deleteCarImages(request, env);
      return json(request, env, { message: 'API route not found.' }, 404);
    } catch (error) {
      if (error instanceof Response) {
        const body = await error.text();
        return new Response(body, { status: error.status, headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) } });
      }
      return json(request, env, { message: 'Image service request failed.' }, 500);
    }
  },
};
