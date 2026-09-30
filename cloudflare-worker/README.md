# AM MOTORS image API

This Cloudflare Worker is the secure image gateway for the AM MOTORS admin panel.
It keeps Firebase Firestore as the car database and uses the `ammotors-images` R2 binding only
for files. The frontend sends a Firebase ID token; the Worker verifies the token signature and
the `admin: true` custom claim before it can upload or delete an object.

## Routes

- `POST /api/upload-car-image` — multipart form fields: `carId`, `image`; returns `{ url, key }`.
- `DELETE /api/delete-car-image` — JSON: `{ carId, key }`; deletes one R2 object.
- `DELETE /api/delete-car-images` — JSON: `{ carId }`; deletes the full car prefix.

Files are written as `cars/{carId}/image-{uuid}.{jpg|png|webp}`. The Worker preserves the source
format because native Sharp image conversion does not run in the Workers runtime. The UI and R2
object metadata retain the correct content type.

## Cloudflare configuration

`wrangler.jsonc` already binds `AMMOTORS_IMAGES` to `ammotors-images` and contains the safe,
public values for the Firebase project, R2 public URL, and allowed production website origin.

Before deployment, review the `ALLOWED_ORIGIN` value. For local development, copy
`.dev.vars.example` to `.dev.vars`; `.dev.vars` is Git-ignored.

Deploy with:

```powershell
npm.cmd run deploy
```

After Cloudflare shows the Worker URL, add it in GitHub as repository Actions variable
`VITE_IMAGE_API_URL`. The Firebase Hosting workflow injects that public URL into the frontend
build. It is an endpoint URL, not a credential.
