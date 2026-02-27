# plan.md — Build Plan
# Catoctin Mountain Park Interactive Map

This document is the single source of truth for building this app.
Feed each iteration block to the coding agent one at a time, in order.
Do not skip iterations. Each one builds on the last.

---

## Project Summary

A private, invite-only interactive satellite map of Catoctin Mountain Park (Maryland).
Authenticated family and friends can browse personally visited Points of Interest (POIs),
view photos, read trip journal notes, and see trail/elevation stats.
The owner (admin) can add, edit, and delete POIs and upload photos via an admin panel.
No public access — the login page is the only thing visible to unauthenticated users.

---

## Stack Summary

- **Frontend**: React 18 + Vite + TypeScript (strict)
- **Styling**: Tailwind CSS
- **Map**: MapLibre GL JS (OSM + Esri satellite, user-togglable)
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Hosting**: Cloudflare Pages
- **Routing**: React Router v6

Refer to `agents.md` for all code style rules before writing any code.

---

## Supabase Schema Reference

### `profiles` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users.id |
| display_name | text | |
| is_admin | boolean | default false |

### `pois` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| name | text | |
| lat | float8 | |
| lng | float8 | |
| visited_date | date | |
| notes | text | nullable |
| trail_name | text | nullable |
| distance_miles | float4 | nullable |
| elevation_gain_ft | int4 | nullable |
| difficulty | text | nullable — 'easy', 'moderate', or 'hard' |

### `poi_photos` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| poi_id | uuid | FK → pois.id |
| storage_url | text | Full URL from Supabase Storage |
| caption | text | nullable |
| is_hero | boolean | default false |

### Row Level Security (RLS)
- `pois`: SELECT for authenticated users; INSERT/UPDATE/DELETE for admin only
- `poi_photos`: SELECT for authenticated users; INSERT/UPDATE/DELETE for admin only
- Storage bucket `photos`: read for authenticated users; write for admin only

---

## Map Constants (store in `src/lib/mapConfig.ts`)

```ts
export const CATOCTIN_CENTER: [number, number] = [-77.4558, 39.6323];
export const CATOCTIN_DEFAULT_ZOOM = 13;
export const CATOCTIN_BOUNDS = [[-77.55, 39.58], [-77.36, 39.69]];

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
```

---

## Iterations

---

### Iteration 1 — Project Scaffold

**Goal**: Get a working Vite + React + TypeScript + Tailwind app deployed to Cloudflare Pages.

**Tasks**:
1. Scaffold with `npm create vite@latest` — React + TypeScript template
2. Install and configure Tailwind CSS
3. Install dependencies: `react-router-dom`, `@supabase/supabase-js`, `maplibre-gl`
4. Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders
5. Create `src/lib/supabaseClient.ts` — initialize and export the Supabase client
6. Create `src/lib/mapConfig.ts` — export the constants listed above
7. Set up React Router in `App.tsx` with three placeholder routes: `/`, `/map`, `/admin`
8. Create empty placeholder page components: `LoginPage.tsx`, `MapPage.tsx`, `AdminPage.tsx`
9. Create `.gitignore` (node_modules, dist, .env.local)
10. Deploy to Cloudflare Pages — confirm placeholder pages are live

**Done when**: Cloudflare Pages URL loads the app with no errors and routes are navigable.

---

### Iteration 2 — Supabase Setup & Auth

**Goal**: Full authentication flow. Only logged-in users can access `/map`.

**Tasks**:
1. In Supabase dashboard: create `profiles`, `pois`, `poi_photos` tables per schema above
2. Enable RLS on all three tables and apply the policies described above
3. Create Supabase Storage bucket named `photos` — authenticated read, admin write
4. Create `src/lib/AuthProvider.tsx` — React context providing `user`, `session`, `loading`, `signIn`, `signOut`
5. Wrap `App.tsx` in `<AuthProvider>`
6. Create `src/components/ProtectedRoute.tsx` — redirects to `/` if no session
7. Create `src/components/AdminRoute.tsx` — redirects to `/map` if not admin
8. Apply `ProtectedRoute` to `/map` and `AdminRoute` to `/admin` in `App.tsx`
9. Build `LoginPage.tsx`:
   - Centered card layout
   - Email + password fields
   - Submit calls `signIn` from auth context
   - Show inline error on bad credentials
   - On success, navigate to `/map`
10. Add sign-out button stub to `MapPage.tsx` (just calls `signOut` and redirects to `/`)
11. Manually create your own user in Supabase Auth dashboard, add a row to `profiles` with `is_admin = true`

**Done when**: You can log in, land on `/map`, and an unauthenticated browser hitting `/map` is redirected to `/`.

---

### Iteration 3 — Map View

**Goal**: MapLibre map rendered on `/map` with OSM and Esri satellite tile toggle.

**Tasks**:
1. Create `src/hooks/useMap.ts` — initializes MapLibre instance in a `useEffect`, cleans up on unmount, returns `map` ref
2. Build `MapContainer.tsx` component — renders the map div, calls `useMap`, passes map ref to children via context or props
3. In `mapConfig.ts`, define both tile sources (OSM and Esri) as typed config objects
4. Add both sources and layers to the map on init; default to satellite (Esri)
5. Create `TileToggle.tsx` — a simple button/toggle in the map UI that switches between OSM and Esri layers
6. Style the toggle as a floating control (top-right corner)
7. Set map initial center to `CATOCTIN_CENTER`, zoom to `CATOCTIN_DEFAULT_ZOOM`
8. Render `MapContainer` in `MapPage.tsx` — map fills the full viewport

**Done when**: Map loads on `/map`, shows satellite imagery by default, toggle switches to OSM and back.

---

### Iteration 4 — POIs on the Map

**Goal**: Fetch POIs from Supabase and render markers. Clicking a marker opens a popup card.

**Tasks**:
1. Create `src/types/poi.ts` — define `POI` and `POIPhoto` interfaces matching the DB schema
2. Create `src/hooks/usePOIs.ts` — fetches all POIs and their hero photo from Supabase, returns `{ pois, loading, error }`
3. Create `POIMarker.tsx` — renders a MapLibre `Marker` at a POI's coordinates; calls an `onClick` callback with the POI
4. In `MapPage.tsx`: call `usePOIs`, render a `POIMarker` for each POI, track `selectedPOI` in React state
5. Create `POICard.tsx` — a floating card/popup component that displays:
   - Hero photo (or placeholder if none)
   - POI name + visited date
   - Trail name, distance, elevation gain, difficulty badge
   - Notes/journal (scrollable if long)
   - Close button that clears `selectedPOI`
6. Render `POICard` in `MapPage.tsx` when `selectedPOI` is not null
7. Create `src/utils/formatDate.ts` — formats ISO date string to human-readable (e.g. "July 4, 2024")

**Done when**: Markers appear on the map, clicking one opens the card with all POI details, close button dismisses it.

---

### Iteration 5 — Photo Gallery in POI Card

**Goal**: POI card shows all photos for a POI, not just the hero.

**Tasks**:
1. Update `usePOIs.ts` (or create `usePOIPhotos.ts`) — fetch all photos for a given POI id
2. Update `POICard.tsx` to include a photo gallery:
   - Hero photo displayed prominently at top
   - Thumbnails of additional photos below
   - Clicking a thumbnail swaps the main displayed photo
3. Display photo captions if present
4. Handle zero-photo POIs gracefully with a placeholder image or icon

**Done when**: POI card shows a working photo gallery with thumbnail navigation.

---

### Iteration 6 — Search

**Goal**: Search bar filters POI markers by name in real time.

**Tasks**:
1. Create `SearchBar.tsx` — a floating input (top-left of map) with a search icon
2. In `MapPage.tsx`, add `searchQuery` state
3. Filter the `pois` array by name (case-insensitive, partial match) using `searchQuery`
4. Only render `POIMarker` for filtered POIs
5. Clear search resets to showing all markers
6. If no results, show a small "No POIs match" message near the search bar

**Done when**: Typing in the search bar filters markers live; clearing restores all.

---

### Iteration 7 — Admin Panel

**Goal**: Admin can create, edit, and delete POIs at `/admin`.

**Tasks**:
1. Create `src/hooks/useAdminPOIs.ts` — exposes `createPOI`, `updatePOI`, `deletePOI` functions wrapping Supabase mutations
2. Build `AdminPage.tsx` layout:
   - Left panel: list of all existing POIs with Edit and Delete buttons
   - Right panel: form (create or edit mode)
3. POI form fields:
   - Name (required)
   - Latitude + Longitude (required, numeric)
   - Visited date (required, date picker)
   - Trail name (optional)
   - Distance in miles (optional, numeric)
   - Elevation gain in feet (optional, numeric)
   - Difficulty (optional, select: easy / moderate / hard)
   - Notes / journal (optional, textarea)
4. On submit: call `createPOI` or `updatePOI` depending on mode; show success/error feedback
5. Delete button shows a confirmation prompt before calling `deletePOI`
6. After any mutation, refresh the POI list

**Done when**: Admin can create a new POI, edit it, and delete it via the admin panel.

---

### Iteration 8 — Photo Upload in Admin

**Goal**: Admin can upload photos to a POI and set the hero photo.

**Tasks**:
1. Create `src/hooks/usePhotoUpload.ts` — handles uploading a file to Supabase Storage, inserting a row in `poi_photos`, returns `{ upload, uploading, error }`
2. Add a photo management section to `AdminPage.tsx` (visible when editing an existing POI):
   - List current photos with thumbnail, caption field, "Set as Hero" button, and Delete button
   - File input to upload a new photo
   - Caption input per photo
3. Upload flow: select file → upload to Storage → get URL → insert `poi_photos` row
4. "Set as Hero" sets `is_hero = true` for that photo and `false` for all others on that POI
5. Deleting a photo removes the `poi_photos` row and deletes the file from Storage
6. Show upload progress indicator

**Done when**: Admin can upload photos, set captions, designate a hero photo, and delete photos.

---

### Iteration 9 — Mobile Responsiveness

**Goal**: The app looks and works well on phones (primary viewing device for family).

**Tasks**:
1. `LoginPage.tsx` — card is full-width on small screens with comfortable padding
2. `MapPage.tsx` — map fills full screen; POI card slides up from bottom on mobile (drawer style) instead of floating
3. `SearchBar.tsx` — collapses to icon on small screens, expands on tap
4. `TileToggle.tsx` — touch-friendly tap targets (min 44px)
5. `POICard.tsx` photo gallery — swipeable on mobile (can use CSS scroll-snap)
6. `AdminPage.tsx` — stacks to single column on mobile
7. Test all interactions at 375px width (iPhone SE viewport)

**Done when**: All pages are usable on a 375px mobile screen with no horizontal overflow.

---

### Iteration 10 — Polish & Production Readiness

**Goal**: Clean up, harden, and prepare for sharing with family.

**Tasks**:
1. Add a custom favicon (hiking or mountain icon)
2. Add Open Graph meta tags to `index.html` — title, description, preview image for when the URL is shared in iMessage/WhatsApp
3. Add a loading skeleton or spinner while POIs are fetching
4. Add a full-page error state if Supabase is unreachable
5. Remove all `console.log` statements
6. Audit all Tailwind classes — remove unused or inconsistent spacing
7. Confirm RLS policies are correct by testing as a non-admin user
8. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages environment variables
9. Final deploy and smoke test: log in, browse POIs, toggle map tiles, search, confirm admin panel is hidden for non-admin users

**Done when**: App is live, clean, and you've successfully shared the URL with at least one family member who can log in and browse.

---

## Future Iterations (Post-Launch Ideas)

These are not in scope for the initial build but can be added later:

- **Visit timeline view** — chronological list of all visits as an alternative to the map
- **GPX upload** — parse trail data from a GPX file to auto-fill stats
- **Multiple park support** — expand beyond Catoctin to other parks you visit
- **Comments** — let family leave comments on a POI
- **Push notifications** — alert family when a new POI is added