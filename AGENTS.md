# agents.md — Coding Agent Instructions
# Catoctin Mountain Park Interactive Map

This file defines the code style, conventions, and rules for every coding agent working on this project. Read this file in full before writing any code.

---

## Project Overview

A private, invite-only interactive map web app for Catoctin Mountain Park (Maryland). Authenticated family/friends can browse personally visited Points of Interest (POIs) with photos, trip notes, and trail stats. An admin (the owner) can add, edit, and delete POIs and upload photos via an admin panel.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (utility-first, no custom CSS files unless absolutely necessary) |
| Map | MapLibre GL JS |
| Map tiles | OpenStreetMap (standard) + Esri World Imagery (satellite) — user togglable |
| Auth + DB + Storage | Supabase (JS client v2) |
| Routing | React Router v6 |
| Hosting | Cloudflare Pages |

---

## Command Execution Convention

- When executing terminal commands from a Windows host, always start via `wsl` first.
- After entering WSL, run commands using standard Linux shell syntax.
- Prefer Linux tooling (`bash`, `rg`, `sed`, etc.) inside WSL for project tasks.

---

## Project Structure

```
src/
  components/       # Reusable UI components (Button, Card, Modal, etc.)
  pages/            # Route-level page components (LoginPage, MapPage, AdminPage)
  hooks/            # Custom React hooks (useAuth, usePOIs, useMap, etc.)
  lib/              # Third-party client setup (supabaseClient.ts, mapConfig.ts)
  types/            # Shared TypeScript interfaces and types (poi.ts, user.ts, etc.)
  utils/            # Pure helper functions (formatDate, validateForm, etc.)
  assets/           # Static assets (icons, images)
  App.tsx           # Root component with router and auth provider
  main.tsx          # Vite entry point
```

---

## TypeScript Rules

- **Strict mode is on.** No `any` types. Use `unknown` and narrow with type guards if needed.
- All props must be explicitly typed with interfaces or type aliases.
- All Supabase query results must be typed using generated or hand-written types — never use implicit `any` from query returns.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Use `satisfies` operator where appropriate to preserve narrowed types.

```ts
// Good
interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visited_date: string;
  notes: string | null;
  trail_name: string | null;
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  difficulty: 'easy' | 'moderate' | 'hard' | null;
}

// Bad
const poi: any = await supabase.from('pois').select('*');
```

---

## Component Rules

- One component per file. Filename matches the component name (PascalCase).
- Functional components only — no class components.
- Keep components small and focused. If a component exceeds ~120 lines, split it.
- Co-locate component-specific logic in the same file unless it's reusable — then extract to `hooks/` or `utils/`.
- No inline styles. Use Tailwind utility classes only.
- All interactive elements must have accessible `aria-label` attributes where text is absent (icon buttons, etc.).

---

## Hooks Rules

- Custom hooks live in `src/hooks/`, named `use<Something>.ts`.
- Hooks must have a single, clear responsibility.
- Always handle loading, error, and success states explicitly.

```ts
// Example pattern
const { data, loading, error } = usePOIs();
```

---

## Supabase Rules

- The Supabase client is initialized once in `src/lib/supabaseClient.ts` and imported everywhere — never re-initialize.
- All DB interactions go through custom hooks, not directly in components.
- Always check and handle Supabase error responses — never silently swallow errors.
- Row Level Security (RLS) is the enforcement layer — never rely on frontend logic alone to restrict data access.
- Storage URLs must be retrieved via `supabase.storage.from('photos').getPublicUrl(path)` — never hardcode storage URLs.

---

## Auth Rules

- Auth state lives in a top-level `AuthProvider` context (`src/lib/AuthProvider.tsx`).
- A `ProtectedRoute` component wraps all authenticated routes — unauthenticated users are redirected to `/`.
- Admin-only routes additionally check `is_admin` from the `profiles` table.
- Never expose admin UI (edit/delete buttons) to non-admin users — check the flag on every render, not just on route entry.
- Sessions persist via Supabase's built-in session storage — do not manually manage tokens.

---

## Routing Rules

- Routes are defined only in `App.tsx`.
- Three routes: `/` (login), `/map` (protected), `/admin` (protected + admin).
- Use React Router `<Navigate>` for redirects, not `window.location`.

```tsx
// Route structure
<Route path="/" element={<LoginPage />} />
<Route element={<ProtectedRoute />}>
  <Route path="/map" element={<MapPage />} />
  <Route element={<AdminRoute />}>
    <Route path="/admin" element={<AdminPage />} />
  </Route>
</Route>
```

---

## Map Rules

- MapLibre GL JS is initialized in a `useMap` hook or a dedicated `MapContainer` component.
- The map instance must be cleaned up on component unmount (`map.remove()`).
- OSM and Esri tile sources are both added on init; the active layer is toggled by showing/hiding layers — not by reinitializing the map.
- POI markers are rendered as MapLibre `Marker` objects, not as DOM overlays.
- Popup/card state (which POI is selected) lives in React state, not in MapLibre popup objects — use MapLibre marker click to set state, render the card in React.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `POICard.tsx` |
| Files (hooks/utils) | camelCase | `usePOIs.ts`, `formatDate.ts` |
| Files (types) | camelCase | `poi.ts` |
| Variables & functions | camelCase | `selectedPOI`, `handleMarkerClick` |
| Constants | SCREAMING_SNAKE_CASE | `MAPBOX_STYLE_URL` |
| Types/Interfaces | PascalCase | `POI`, `UserProfile` |
| Database tables | snake_case | `pois`, `poi_photos`, `profiles` |
| CSS classes | Tailwind only — no custom class names |  |

---

## Error Handling

- All async operations must have try/catch or `.catch()` handlers.
- User-facing errors must display a readable message — never expose raw Supabase error messages to the UI.
- Use a consistent toast or inline error pattern across the app (decide once, use everywhere).
- Console errors are acceptable in development, but no `console.log` should remain in production builds. Use an `isDev` guard if needed.

---

## Environment Variables

- All secrets and config live in `.env.local` (never committed).
- Vite env vars must be prefixed `VITE_`.
- Required vars:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
- On Cloudflare Pages, these are set as environment variables in the dashboard.
- Never hardcode credentials anywhere in source code.

---

## Git & Commit Rules

- Branch from `main` for each phase: `phase/1-foundation`, `phase/2-map`, etc.
- Commit messages follow conventional commits format:
  ```
  feat: add POI popup card component
  fix: correct RLS policy on poi_photos
  chore: update dependencies
  ```
- Never commit `.env.local`, `node_modules/`, or Supabase service role keys.
- `.gitignore` must include: `.env.local`, `dist/`, `node_modules/`.

---

## What NOT To Do

- Do not use `useEffect` for data fetching — use custom hooks that encapsulate the fetch lifecycle.
- Do not store auth tokens in `localStorage` manually — Supabase handles this.
- Do not use CSS modules or styled-components — Tailwind only.
- Do not create barrel `index.ts` files unless the folder has 4+ exports.
- Do not hardcode Catoctin park coordinates — store them as named constants in `src/lib/mapConfig.ts`.
- Do not make Supabase calls directly inside JSX or event handlers — always delegate to a hook or util.
