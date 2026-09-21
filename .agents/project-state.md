# Project state (as of 2026-09-19)

**Phase: backend/data layer built, UI skeleton in progress.** The Suwayomi client surface (services, types, IndexedDB, stores) is complete and typed; the UI is a dev console plus three unwired components. No router, no reading view, no tests.

## Works end-to-end (type-checked, exercised)

- HTTP layer: `ApiClient` with error normalization, body/response modes; 9 domain services covering the REST contract; GraphQL executor; 2 WebSockets (downloads/update) in `realtimeService`.
- Offline layer: IndexedDB (4 stores), `dbService` helpers, `offlineStore` hydrate/mutate mirror.
- `App.vue` dev console: server health check (degrades to demo mode), IDB demo actions (save/progress/bookmark/remove/clear), event log.

## Known breakage

- Toolchain migrated to Tailwind v4 + daisyUI 5, flowbite removed (2026-09-19). Build is clean except App.vue unused `test*` functions left from the in-progress daisyUI restyle of the dev console.
- All three components (`MangaCard`, `Navbar`, `OfflineManager`) are dead code — nothing imports them (grep confirms zero usage).
- Navbar dark-mode toggle writes `localStorage.theme` on toggle only; initial mount reads it, but the toggle state doesn't initialize from storage (starts `false`) — minor UX bug if adopted.
- Server URL is env-driven: `.env` `SUWAYOMI_SERVER_URL` = `https://manga-api.uchupx.work`; health check verified live in browser (HTTP 200 on `/api/v1/settings/about`).
- Router live: vue-router 4 (`src/router/index.ts`) with `/` Home (placeholder), `/sources` → `pages/Source.vue` (live API data verified), `/settings` (placeholder). Mobile dock links navigate with `dock-active` state.

## Not started (gaps to fill before this is an app)

- Reader UI consuming `mangaService.getPageImageUrl` / `getPageImage`.
- Wiring components: `MangaCard` (already has offline-save logic), `Navbar` (search + offline modal trigger), `OfflineManager` (3-tab modal).
- Offline sync/reconciliation (server progress ↔ IndexedDB history), service-worker/asset caching for true offline reads.
- Tracker/backup/settings/update-service UIs — services exist, nothing calls them.

Update this file when status materially changes; don't duplicate it in other docs.
