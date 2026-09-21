# Conventions

## Runtime & tooling

- Bun is the runtime/PM: `bun run dev` (Vite, port 5173, host 0.0.0.0), `bun run build` (`vue-tsc -b && vite build`), `bun run preview`.
- TypeScript is `strict` + `noUnusedLocals` + `noUnusedParameters` — unused vars break the build.
- No ESLint/Prettier configured; no test framework. `vue-tsc` is the only gate.

## Code style (as found, keep it)

- **Vue SFCs**: `<script setup lang="ts">` + `defineProps<{...}>()` / `defineEmits<{}>()` type syntax. daisyUI semantic classes (`btn`, `navbar`, `modal`, `tabs`) for components; Tailwind utilities inline for layout. Dark mode via `class` strategy (`@custom-variant dark` in `src/assets/main.css`, toggled on `document.documentElement`).
- **Path alias**: `@/` → `src/` everywhere, including inside stores/services.
- **Stores**: Options API style (`defineStore('id', { state, getters, actions })`), not setup stores.
- **Services**: class + `constructor(private client: ApiClient = defaultApiClient) {}` + one exported singleton `export const xService = new XService()`. New domains go in a new file and get re-exported from `src/services/index.ts`.
- **Types**: prefer `interface` for object shapes, `type` unions for string enums (`MangaStatus`, `UpdateStrategy`). `any` appears in catch handlers (`err: any`) — tolerated, keep messages human-readable in `this.error`.
- **Comments**: JSDoc blocks above public service methods (usually referencing the `API-Contract.md` section number); section banner comments (`// ===== 2. Data Models =====`) in types.

## Error handling

- Services never catch — they throw (`SuwayomiApiError` from `apiClient`, raw `Error` from `graphqlService`).
- Stores own the catch: set `error` (string), never leave `isLoading` stuck (`finally`).

## Gotchas (verified, will bite)

- **Tailwind v4 + daisyUI 5** via `@tailwindcss/vite` — CSS-first config in `src/assets/main.css` (`@plugin "daisyui"`); there is no `postcss.config.js`/`tailwind.config.js`.
- **Server URL**: `.env` `SUWAYOMI_SERVER_URL` is read once at module load by the `apiClient`/`graphqlService`/`realtimeService` constructors — changing it requires a dev-server restart.
- `API-Contract.md` is in Indonesian; `src/types/api.ts` is the English-mirrored source to work from.
- REST quirks to preserve: several Suwayomi mutations are GETs (`/manga/{id}/library`, `/extension/install/{pkg}`, `/downloads/start`) — match the contract, don't "fix" to POST. Some PATCH/POST bodies are form-urlencoded (`isUrlEncoded: true`) per endpoint.
- GraphQL service bypasses `ApiClient` (no auth header, no `SuwayomiApiError`) — if you unify it, update this doc.
