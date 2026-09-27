# AM MOTORS — Enhancements & Code Review

> Full-stack review of the React/Vite frontend and the Express + Firebase/Firestore backend.
> Findings are grouped by **priority** so you can work top-down. Each item lists the **file:line**, the **problem**, and a **concrete fix**.
>
> Reviewed on 2026-09-28. No files were modified — this is a checklist for the team.

---

## 🔴 Fix first (breaks in production / security / data loss)

These have real user or security impact and should go before anything else.

### 1. Hero image + splash logo 404 in the production build
- **Where:** `frontend/index.html:24` (`<link rel="preload" href="/src/assets/gmc-hero-mobile.jpg">`) and `frontend/index.html:99` (`<img src="/src/assets/am-motors-logo.png">`)
- **Problem:** These files live in `frontend/src/assets/`, not `public/`. Vite only serves `/src/...` paths in **dev**; in the production build they resolve to **404**. Result: the mobile LCP image preload is wasted and the splash-screen logo is broken for every real visitor.
- **Fix:** Move both assets to `frontend/public/` and reference them with stable root paths (`/gmc-hero-mobile.jpg`, `/am-motors-logo.png`), OR import them through a JS module so Vite fingerprints them. Verify with `npm run build && npm run preview`.

### 2. No error boundary — one render error = blank white page
- **Where:** `frontend/src/App.jsx:54` (`<Suspense>` with no error boundary)
- **Problem:** Suspense handles loading, not thrown errors. A malformed Firestore record in `CarDetailsPage` takes down the whole app with no recovery.
- **Fix:** Wrap the routes in an `ErrorBoundary` (class component or `react-error-boundary`) that renders a friendly "Something went wrong — reload" fallback.

### 3. Rate limiter is effectively global behind a proxy
- **Where:** `backend/src/rateLimit.js:5` (`request.ip`), no `trust proxy` set in `backend/src/app.js`
- **Problem:** Without `app.set('trust proxy', …)`, `request.ip` is the **proxy's** IP on Cloud Run / Firebase Hosting / Render, so **all visitors share one rate-limit bucket** — 120 requests from anyone locks out everyone.
- **Fix:** Add `app.set('trust proxy', 1)` in `createApp()` (match the real hop count) and add a test that sends `X-Forwarded-For`.

### 4. CORS silently opens to the whole internet if `CORS_ORIGINS` is unset
- **Where:** `backend/src/server.js:5-7`, `backend/src/app.js:29`
- **Problem:** When `CORS_ORIGINS` is missing, it defaults to `'*'` and reflects any Origin. A prod deploy that forgets the env var is fully open.
- **Fix:** In non-dev environments, throw (or loudly warn) if `CORS_ORIGINS` is unset. Default to an empty allowlist, not `'*'`.

### 5. Fetch race conditions overwrite fresh data with stale data
- **Where:** `frontend/src/pages/HomePage.jsx:19`, `CarsPage.jsx:17`, `CarDetailsPage.jsx:15-19`, `AdminPage.jsx:489-492`
- **Problem:** `getCars()` in `useEffect` has no ignore/abort guard. React StrictMode double-fires it in dev; fast navigation can apply an older response last.
- **Fix:** Add an `ignore` flag and bail in the `.then`/`.catch`, returning a cleanup that sets `ignore = true`.

### 6. Blob preview URLs leak in the admin car form
- **Where:** `frontend/src/admin/AdminPage.jsx` (`CarForm`, ~line 392/459)
- **Problem:** `URL.createObjectURL` previews are revoked on manual removal, but not if the form is cancelled or unmounts mid-save — the object URLs leak.
- **Fix:** Add a `useEffect` cleanup that revokes every remaining `selectedFiles[].preview` on unmount.

### 7. Service worker caches everything forever
- **Where:** `frontend/public/sw.js:32-38`
- **Problem:** Every successful GET (including token-signed Firebase Storage image URLs) is cached with no TTL or size cap. Updated/deleted vehicle images keep serving stale indefinitely, and the cache grows without bound.
- **Fix:** Use stale-while-revalidate with a max-age for images, cap the cache entry count, and exclude/short-TTL Firebase Storage URLs.

### 8. Firebase config hardcoded in source
- **Where:** `frontend/src/services/firebaseApp.js:4-9`
- **Problem:** Client Firebase keys aren't true secrets, but hardcoding blocks per-environment configs and clean rotation.
- **Fix:** Move to `import.meta.env.VITE_FIREBASE_*` and keep `.env` out of git. **Also confirm Firestore rules allow public `read` but admin-only `write`** — `carsApi.js` reads Firestore directly from the client.

---

## ⚡ How to make everything faster (performance optimization)

This is the section the team asked for — concrete wins, roughly ordered by impact-per-effort.

### Backend / data layer

1. **Stop scanning the whole collection on every request.** `GET /api/v1/cars` (`backend/src/app.js:94-104`) calls `getAll()` → downloads **every** car doc → filters/sorts/paginates in JS (`firestoreCarsRepository.js:34-39`). Fine at 50 cars, expensive and slow at 500+.
   - Push `where()` + `orderBy()` down into Firestore.
   - Use cursor pagination (`startAfter`) instead of offset slicing.
   - **`firestore.indexes.json` is currently empty** — add composite indexes for the real query shapes: `status ASC + price ASC/DESC`, `status ASC + year ASC/DESC`, `make ASC + price ASC/DESC`.
2. **Cache the flat-file repo.** `backend/src/carsRepository.js:72-79` does `fs.readFile` on **every** request (including `getById`). Add a small in-memory cache with `fs.watch` invalidation, or mark it dev-only.
3. **Batch reads in migration.** `backend/scripts/migrateCars.js:34-36` does one `reference.get()` per car in a loop. Use `firestore.getAll(...refs)` for a single round-trip, and chunk writes into batches of ≤500 (line 21/45 — a single batch silently fails past 500 docs).
4. **Set server timeouts** so a hung Firestore call can't hold connections forever: `server.setTimeout(30_000)` and `server.keepAliveTimeout = 65_000` in `server.js`.

### Frontend load performance (Core Web Vitals)

5. **Fix the hero preload (see 🔴 #1).** Once the path is correct, the mobile LCP image actually preloads — a large, direct LCP win.
6. **Cut per-vehicle icon requests.** `frontend/src/components/CarSpecs.jsx:2-23` imports **10 separate icon files** = 10 HTTP requests per detail page. Use inline SVGs (via `Icon.jsx`) or a single SVG sprite.
7. **Eliminate layout shift (CLS).** `frontend/src/components/VehicleImage.jsx:20-28` sets no `width`/`height`/`aspect-ratio`, so every card/gallery image shifts layout as it loads. Forward `width`/`height` or set `aspect-ratio` on the wrapper.
8. **Add `decoding="async"` and `loading="lazy"`** to `VehicleImage`'s `<img>` so off-screen grid/gallery images don't block the main thread or compete with the LCP image.
9. **Trim pointer-move work.** `frontend/src/utils/useInteractiveDepth.js:36` schedules a rAF on *every* pointer move page-wide. Early-return with `if (!event.target.closest?.('[data-tilt]')) return;` **before** scheduling the frame.
10. **Profile the admin chunk.** `AdminPage.jsx` is already lazy-loaded (good) but pulls 25+ `lucide-react` icons. Run `npx vite-bundle-visualizer` to confirm nothing heavy leaks into the main bundle.
11. **Add a build-time bundle budget / analyzer** to `vite.config.js` so regressions are caught before they ship.

### Perceived performance

12. **Replace `window.location.reload()` retry** (`CarsPage.jsx:61`) with a state-based re-fetch (`retryKey`) so retrying doesn't nuke filters and re-download the whole app shell.
13. **Don't auto-reload on SW update** (`offlineSupport.js:6-9`) — show a "New version available — Reload" toast instead. Silent reloads discard in-progress forms and feel like a crash.

---

## 🟠 High value (correctness, a11y, SEO)

### Correctness
- **Price filter has invisible gaps.** `CarsPage.jsx:27` uses `car.price < maximum`; a car at exactly $50k/$75k falls between bands. Use `<=` or adjust boundaries.
- **`formatMileage(undefined)` → `"NaN km"`.** `frontend/src/utils/formatters.js:9`. Guard `if (mileage == null) return 'N/A';`.
- **`CarForm` state bleeds between add/edit.** `AdminPage.jsx` renders `<CarForm mode="add">`/`<CarForm mode="edit">` with no `key`, so local state isn't reset. Add `key={view === 'add' ? 'add' : selectedCar?.id}`.
- **`remove()` double-reads and can race.** `firestoreCarsRepository.js:75-79` re-fetches a doc the route already fetched; a concurrent delete surfaces a spurious 404. Delete unconditionally or wrap in a transaction like `update()`.
- **`toPublicCar` crashes on missing `specifications`.** `firestoreCarsRepository.js:8-29` destructures `data.specifications.*` with no guard — one bad doc 500s the whole inventory endpoint. Add `const specs = data.specifications || {}`.
- **`update()` post-transaction read is a TOCTOU window.** `firestoreCarsRepository.js:57-73` can return `null` → `{}` with a 200. Re-read inside the transaction or build the merged result in memory.

### Accessibility
- **Lightbox has no focus trap / focus move.** `CarGallery.jsx:122-138` — focus stays behind the modal and Tab reaches page content. Move focus into the dialog on open and trap it, or use a native `<dialog>` + `showModal()` (as `DeleteDialog` already does).
- **Menu toggle missing `aria-controls`.** `Navbar.jsx:94` — add `id="main-nav"` to the `<nav>` and `aria-controls="main-nav"` to the button.
- **WhatsApp nav link reads "Contact" only.** `Navbar.jsx` — add `aria-label="Contact via WhatsApp"`.
- **`<aside>` needs a name.** `CarDetailsPage.jsx:38` — add `aria-label="Vehicle summary"`.
- **Fallback image keeps the real vehicle's alt text.** `VehicleImage.jsx` — set `alt=""` / `"Image unavailable"` when the placeholder is shown.
- **Duplicate `<h1>` in accessibility tree.** `Hero.jsx:148 & 172` render two `<h1>`s (desktop + mobile) simultaneously. `aria-hidden` the inactive one.
- **Loading spinner not announced.** `CarDetailsPage.jsx:22` — add `role="status"` + `aria-label`.

### SEO (important for a dealership)
- **No per-page `<title>` / meta description.** `index.html:6-7` — every route shares the home title. Set `document.title` in a `useEffect` per page (e.g. `${car.year} ${car.make} ${car.model} | AM MOTORS`).
- **No JSON-LD structured data.** Add `AutoDealer` / `LocalBusiness` schema in `index.html` and consider `Car`/`ItemList` on listing pages — big rich-result win.
- **No `<link rel="canonical">`.** Add to `index.html` (per-page ideally).
- **No favicon / web manifest.** `public/` has none → `/favicon.ico` 404s and the app isn't PWA-installable. Add `favicon.ico`, `apple-touch-icon.png`, and `manifest.webmanifest` (+ `<link rel="manifest">`).
- **Sitemap misses vehicle URLs.** `public/sitemap.xml` is static and omits `/cars/:id`. Generate it at build time or serve dynamically from the backend.
- **Soft 404s.** `NotFoundPage.jsx` returns HTTP 200 for unknown routes. Add `<meta name="robots" content="noindex">` dynamically on that page.

### Observability
- **Error log drops the message/stack.** `backend/src/app.js:191-194` logs only `error.name`. Add `errorMessage` and (non-prod) `stack`.
- **No process-level crash handlers.** `server.js` — add `process.on('unhandledRejection', …)` / `uncaughtException` with structured logging.
- **Readiness probe swallows the reason.** `app.js:69-77` — log why `/api/ready` failed.
- **`console.log` at startup** (`server.js:15`) breaks JSON log aggregation — use the injected `logger`.

---

## 🟡 Medium (maintainability, hardening, duplication)

- **Duplicate `CARS_PER_PAGE = 6`** in `HomePage.jsx:10` and `CarsPage.jsx:8` → move to `src/config/constants.js`.
- **`money()` duplicates `formatPrice()`** — `AdminPage.jsx:47-49` vs `formatters.js:1-7`. Import the shared one.
- **`SelectField` duplicates `StyledSelect`** — `AdminPage.jsx:290-389` reimplements ~80% of `components/StyledSelect.jsx`. Extract one shared `Select`.
- **`AdminPage.jsx` is a 549-line monolith** with 10+ components. Split into `src/admin/components/`.
- **Public car shape defined twice** — `firestoreCarsRepository.js:8-29` and `carsRepository.js:10-23`. Extract `PUBLIC_CAR_FIELDS` + a shared `toPublicCar`.
- **`cleanText` regex is fragile** — `carInput.js:31-37` mangles legit values (`"BMW X5 M>50i"`) and misses multiline tags. Reject `<`/`>` via validation instead of silently mutating; reserve HTML stripping for `description`.
- **In-memory rate limiter doesn't scale** — `rateLimit.js`. Fine single-instance; document it or move to Redis for horizontal scaling. Also the cleanup only runs above 10k entries — add a periodic sweep.
- **`401` missing `WWW-Authenticate`** — `adminAuth.js:10,21`. Add `Bearer realm="AMMOTORS Admin"`.
- **Firestore rule allows `year <= 2200`** while the API caps at `currentYear + 1` (`firestore.rules:46` vs `carInput.js:136`). Tighten the rule.
- **No `Content-Type` guard on writes** — non-JSON bodies yield a misleading "Must be a JSON object." Return `415` for wrong content types.
- **Flat-file data path unchecked at startup** — missing `data/cars.json` 500s every GET and `/api/ready` doesn't catch it. `fs.access` in the readiness check.
- **`package.json` has no `engines`** — backend uses Node ≥20.6 flags (`--env-file-if-exists`). Add `"engines": { "node": ">=20.6.0" }`.
- **OpenAPI incomplete** — `openapi.yaml` omits all `/api/admin/cars` endpoints and the `Car` request schema, and hardcodes `localhost:5000` as the only server.
- **Maps iframe unsandboxed** — `About.jsx:6-13`. Add `sandbox="allow-scripts allow-same-origin"`.
- **Instagram URL carries a `stkn` share token** — `dealership.js:5`. Use the clean profile URL.
- **`ScrollManager` single-rAF hash scroll** — `App.jsx:21-26` can fire before the lazy route mounts. Use double-rAF or a short poll.

---

## 🟢 Low (polish, dead code, tests)

### Dead code / clarity
- `const visibleTheme = theme;` — `App.jsx:48`, pointless alias.
- `demoCars` exported from `AdminPage.jsx:548` only for tests — move to a fixture.
- Featured vehicle copy hardcoded/duplicated in `Hero.jsx:157-163 & ~180` — move to `dealership.js`.

### Test coverage gaps
- **Frontend:** no tests for `VehicleImage` fallback/timeout, `CarDetailsPage` loading/404/error states, `CarFilters` price ranges, `WhatsAppButton` message building, `offlineSupport.js`, or `formatters.js`.
- **Backend:** no tests for `/api/v1/cars` cache headers, admin rate limiter, `getById` null path, patch that omits `specifications`, or the `migrateCars`/`setAdminClaim` scripts.

---

## Suggested order of work

1. **🔴 Fix first (1–8)** — prod-breaking + security. Ship these before anything else.
2. **⚡ Optimization backend #1–4 and frontend #5–8** — the biggest speed wins (Firestore indexing + hero preload + image attrs).
3. **🟠 High-value** correctness, a11y, SEO — dealership visibility and reliability.
4. **🟡 Medium** hardening + de-duplication to slow future bugs.
5. **🟢 Low** polish and backfill tests around the areas you touch.

**Two-minute wins with outsized impact:** move the two `/src/assets/` refs to `public/` (#1), add `trust proxy` (#3), add the Firestore composite indexes (⚡#1), and add `decoding="async" loading="lazy"` + dimensions to `VehicleImage` (⚡#7–8).
