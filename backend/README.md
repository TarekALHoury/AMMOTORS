# AMMOTORS backend

The Express API uses Firebase Authentication for admin identity, Cloud Firestore for the
car catalog, and Cloud Storage for vehicle images. When Firebase environment variables are
absent, public reads continue to use `data/cars.json`; admin routes return `503`. This keeps
the existing local frontend contract working while making incomplete production setup fail
closed for writes.

## Environment

Copy `.env.example` to a secure environment configuration location. Node does not load the
file automatically; provide these values through the process manager or hosting platform.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port, default `5000`. |
| `CORS_ORIGINS` | Production | Comma-separated exact frontend origins. |
| `FIREBASE_PROJECT_ID` | Firebase mode | Firebase project ID. |
| `FIREBASE_STORAGE_BUCKET` | Firebase mode | Storage bucket name shown in Firebase Storage. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local production access only | Absolute path to a service-account JSON file stored outside the repository. Do not use this on Google-managed hosting, which supplies Application Default Credentials. |

Never prefix backend credentials with `VITE_`, embed a service account in frontend code, or
commit `.env`/JSON credentials. Firebase web configuration used by browser SDKs is public
configuration, but still belongs in the frontend developer's environment configuration.

## Public API contract (backward compatible)

### `GET /api/cars`

Returns the existing JSON array of public cars. `GET /api/cars/:id` returns one object or
`404 { "message": "Car not found." }`.

```json
{
  "id": "Firestore-document-id",
  "make": "BMW",
  "model": "M4 Competition",
  "year": 2024,
  "price": 80000,
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
- `DELETE /api/admin/cars/:id` — deletes Storage objects under `cars/{id}/`, then the car;
  returns `204`.

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
  "images": ["https://firebasestorage.googleapis.com/..."]
}
```

Rules: years are integer `1886` through next calendar year; price, mileage and horsepower
are non-negative; status is `available`, `reserved`, or `sold`; at most 20 HTTPS image URLs;
unknown fields are rejected. Text is trimmed, control characters and HTML tags are removed.
Validation failures return `400 { "message": "Invalid car data.", "errors": { ... } }`.

## Frontend image workflow

1. Sign in with Firebase Authentication and obtain an ID token.
2. Create the car with `images: []`; retain the returned car ID.
3. Upload JPEG, PNG, or WebP files (under 10 MiB each) with the Firebase Storage browser SDK
   to `cars/{carId}/{uniqueFileName}`. Storage rules require the admin custom claim.
4. Obtain each download URL and `PATCH /api/admin/cars/{carId}` with the complete `images`
   URL array.
5. Refresh the ID token after an administrator grants or removes a custom claim.

Use collision-resistant filenames and client-side file-type/size checks for user feedback;
the Storage rules remain the enforcement boundary.

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

## Operational scripts

After Application Default Credentials and environment variables are configured:

```powershell
npm.cmd run admin:grant -- admin@example.com
npm.cmd run migrate:cars
```

Migration refuses to overwrite an existing car ID. Review the target project first; use
`npm.cmd run migrate:cars -- --force` only when replacement is intentional.
