# AMMOTORS backend

The Express API uses Firebase Authentication for admin identity and Cloud Firestore for the
car catalog. Cloudflare R2 image handling lives in the separate, Worker-compatible
[`../cloudflare-worker`](../cloudflare-worker) project.
When Firebase environment variables are absent, public reads continue to use `data/cars.json`;
admin routes return `503`. This keeps the existing local frontend contract working while making
incomplete production setup fail closed for writes.

## Environment

Copy `.env.example` to `.env` for local development. The npm start, development, migration,
and administrator scripts load this Git-ignored file automatically. On hosting, provide the
same values through the platform environment instead.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port, default `5000`. |
| `CORS_ORIGINS` | Production | Comma-separated exact frontend origins. |
| `FIREBASE_PROJECT_ID` | Firebase mode | Firebase project ID. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local production access only | Absolute path to a service-account JSON file stored outside the repository. Do not use this on Google-managed hosting, which supplies Application Default Credentials. |

Never prefix backend credentials with `VITE_`, embed a service account in frontend code, or
commit `.env`/JSON credentials. Firebase web configuration used by browser SDKs is public
configuration, but still belongs in the frontend developer's environment configuration.

## Public API contract (backward compatible)

### `GET /api/cars`

Returns the existing JSON array of public cars. `GET /api/cars/:id` returns one object or
`404 { "message": "Car not found." }`.

### `GET /api/v1/cars`

Returns `{ "items": [...], "page": { "limit": 24, "hasMore": false, "nextCursor": null } }`.
Supported query parameters are `search`, `status`, `make`, `model`, `year`, `minPrice`,
`maxPrice`, `minMileage`, `maxMileage`, `limit`, `cursor`, and `sort`. Sort values are
`newest`, `oldest`, `price-high`, `price-low`, `mileage-high`, `mileage-low`, and `make`.
Unknown parameters, invalid ranges, unsupported sorting, and malformed cursors return `400`.
The cursor is opaque and must be returned unchanged by clients.

The complete machine-readable contract is in [`openapi.yaml`](openapi.yaml).

```json
{
  "id": "Firestore-document-id",
  "make": "BMW",
  "model": "M4 Competition",
  "year": 2024,
  "price": 80000,
  "condition": "Used",
  "mileage": 12000,
  "engine": "3.0L Twin-Turbo",
  "horsepower": 503,
  "transmission": "Automatic",
  "drivetrain": "RWD",
  "fuel": "Petrol",
  "exteriorColor": "Black",
  "interiorColor": "Black",
  "description": "Clean vehicle.",
  "status": "available",
  "images": ["https://..."]
}
```

## Admin API contract

Every request requires `Authorization: Bearer <Firebase ID token>`. The verified token must
contain the custom claim `admin: true`. Responses are `401` for missing/invalid tokens,
`403` for authenticated non-admins, and `503` when Firebase is not configured.

- `POST /api/admin/cars` — create; returns `201` and the public car.
- `PUT /api/admin/cars/:id` — full replacement; returns the public car.
- `PATCH /api/admin/cars/:id` — partial update; returns the public car.
- `DELETE /api/admin/cars/:id` — removes a car document and returns `204`.

Create/PUT body (PATCH accepts any non-empty subset):

```json
{
  "make": "BMW",
  "model": "M4 Competition",
  "year": 2024,
  "price": 80000,
  "description": "Clean vehicle.",
  "status": "available",
  "specifications": {
    "mileage": 12000,
    "engine": "3.0L Twin-Turbo",
    "horsepower": 503,
    "transmission": "Automatic",
    "drivetrain": "RWD",
    "fuel": "Petrol",
    "exteriorColor": "Black",
    "interiorColor": "Black"
  },
  "images": [{
    "url": "https://images.example.com/cars/car-id/image-123.webp",
    "key": "cars/car-id/image-123.webp"
  }]
}
```

Rules: years are integer `1886` through next calendar year; price, mileage and horsepower
are non-negative; status is `available`, `reserved`, or `sold`; at most 20 HTTPS image URLs;
unknown fields are rejected. Text is trimmed, control characters and HTML tags are removed.
Validation failures return `400 { "message": "Invalid car data.", "errors": { ... } }`.

## R2 image workflow

The Cloudflare Worker at [`../cloudflare-worker`](../cloudflare-worker) owns R2 upload and
deletion. It verifies Firebase admin ID tokens, writes objects through an R2 binding, and returns
`{ url, key }`. The frontend writes that record into the existing Firestore car document and has
no R2 credentials.

## Tests and emulators

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run test:rules
```

`npm test` runs unit/API regression tests and marks emulator-only rules tests skipped.
`npm run test:rules` starts isolated Firestore and Storage emulators and executes the rules
suite. Firebase CLI 15 requires JDK 21 or newer for the emulators. No live Firebase data or
credentials are used.

GitHub Actions runs unit/API tests, Firestore and Storage emulator rules tests, and the
production-dependency audit for backend changes. The workflow does not require Firebase secrets.

## Operations and abuse controls

- `GET /api/health` is a liveness check and does not contact Firebase.
- `GET /api/ready` checks Firestore when Firebase mode is enabled and returns only `ready` or
  `not_ready`, never credential or connection details.
- Public inventory requests are limited to 120 per client per minute; admin routes are limited
  to 60 per client per minute. A rejected request returns `429` with `RateLimit-*` and
  `Retry-After` headers.
- Unexpected errors are logged as structured objects containing the request ID, method, path,
  and error class without returning internal error details to the client.

## Operational scripts

After Application Default Credentials and `FIREBASE_PROJECT_ID` are configured:

```powershell
npm.cmd run admin:grant -- admin@example.com
npm.cmd run migrate:cars
```

Migration refuses to overwrite an existing car ID. Review the target project first; use
`npm.cmd run migrate:cars -- --force` only when replacement is intentional.
