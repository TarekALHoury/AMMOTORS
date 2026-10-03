import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_SIZE_LOOKUPS = 200;
const STORAGE_LIMIT_BYTES = 3 * 1024 ** 3;
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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
  if (!match) return { status: 401, message: 'Authentication required.' };
  try {
    const { payload } = await jwtVerify(match[1], FIREBASE_JWKS, {
      audience: env.FIREBASE_PROJECT_ID,
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      algorithms: ['RS256'],
    });
    if (payload.admin !== true) return { status: 403, message: 'Admin access required.' };
    return { payload };
  } catch (error) {
    return { status: 401, message: 'Invalid or expired authentication token.' };
  }
}

function imageKey(carId, extension) {
  return `cars/${carId}/image-${crypto.randomUUID()}.${extension}`;
}

export async function bucketUsage(bucket) {
  let usedBytes = 0;
  let objectCount = 0;
  let cursor;
  do {
    const page = await bucket.list({ cursor, limit: 1000 });
    for (const object of page.objects) {
      usedBytes += object.size;
      objectCount += 1;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return { usedBytes, objectCount, limitBytes: STORAGE_LIMIT_BYTES };
}

export function fitsStorageLimit(usedBytes, incomingBytes) {
  return usedBytes + incomingBytes <= STORAGE_LIMIT_BYTES;
}

async function getStorageUsage(request, env) {
  const authorization = await requireAdmin(request, env);
  if (authorization.status) return json(request, env, { message: authorization.message }, authorization.status);
  return json(request, env, await bucketUsage(env.AMMOTORS_IMAGES));
}

async function uploadImage(request, env) {
  const authorization = await requireAdmin(request, env);
  if (authorization.status) return json(request, env, { message: authorization.message }, authorization.status);
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
  const usage = await bucketUsage(env.AMMOTORS_IMAGES);
  if (!fitsStorageLimit(usage.usedBytes, image.size)) {
    return json(request, env, { message: 'Image storage is full. Delete images before uploading more.' }, 507);
  }
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!validImageBytes(bytes, image.type)) {
    return json(request, env, { message: 'The uploaded file is not a valid image.' }, 400);
  }
  const key = imageKey(carId, IMAGE_TYPES.get(image.type));
  await env.AMMOTORS_IMAGES.put(key, bytes, {
    httpMetadata: {
      contentType: image.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: { carId },
  });
  const url = `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  return json(request, env, { url, key, sizeBytes: image.size }, 201);
}

async function getImageSizes(request, env) {
  const authorization = await requireAdmin(request, env);
  if (authorization.status) return json(request, env, { message: authorization.message }, authorization.status);

  const { images } = await request.json().catch(() => ({}));
  if (!Array.isArray(images) || images.length > MAX_SIZE_LOOKUPS) {
    return json(request, env, { message: `Provide up to ${MAX_SIZE_LOOKUPS} car image keys.` }, 400);
  }

  const uniqueImages = [...new Map(images.map((image) => [image?.key, image])).values()];
  if (uniqueImages.some(({ carId, key } = {}) => !carIdPattern.test(carId || '')
    || typeof key !== 'string' || !key.startsWith(`cars/${carId}/`))) {
    return json(request, env, { message: 'Invalid car image key.' }, 400);
  }

  const sizes = await Promise.all(uniqueImages.map(async ({ key }) => {
    const object = await env.AMMOTORS_IMAGES.head(key);
    return { key, sizeBytes: object?.size ?? null };
  }));
  return json(request, env, { images: sizes });
}

async function deleteOneImage(request, env) {
  const authorization = await requireAdmin(request, env);
  if (authorization.status) return json(request, env, { message: authorization.message }, authorization.status);
  const { carId, key } = await request.json().catch(() => ({}));
  if (!carIdPattern.test(carId || '') || typeof key !== 'string' || !key.startsWith(`cars/${carId}/`)) {
    return json(request, env, { message: 'Invalid car image key.' }, 400);
  }
  await env.AMMOTORS_IMAGES.delete(key);
  return json(request, env, { deleted: true, key });
}

async function deleteCarImages(request, env) {
  const authorization = await requireAdmin(request, env);
  if (authorization.status) return json(request, env, { message: authorization.message }, authorization.status);
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
      if (request.method === 'GET' && url.pathname === '/api/storage-usage') return getStorageUsage(request, env);
      if (request.method === 'POST' && url.pathname === '/api/car-image-sizes') return getImageSizes(request, env);
      if (request.method === 'DELETE' && url.pathname === '/api/delete-car-image') return deleteOneImage(request, env);
      if (request.method === 'DELETE' && url.pathname === '/api/delete-car-images') return deleteCarImages(request, env);
      return json(request, env, { message: 'API route not found.' }, 404);
    } catch (error) {
      return json(request, env, { message: 'Image service request failed.' }, 500);
    }
  },
};
