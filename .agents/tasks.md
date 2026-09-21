# How-to: common changes

## Add a service for a new API domain

1. Add/extend entity types in `src/types/api.ts` (mirror `API-Contract.md`; source IDs stay `string`).
2. Create `src/services/<domain>Service.ts`: `export class XService { constructor(private client: ApiClient = defaultApiClient) {} ... }`, methods return `Promise<T>` typed from the contract, add JSDoc with the contract section. `POST`/`PATCH` bodies: JSON default; form-urlencoded endpoints need `{ isUrlEncoded: true }`; file uploads `{ isMultipart: true }` with FormData; binary → `client.getBlob(...)`.
3. `export const xService = new XService();` and add `export * from './xService'` to `src/services/index.ts`.

Done when: `bunx vue-tsc -b` passes and the singleton is reachable via `@/services`.

## Add server state (online side)

1. New action in `mangaStore`: `isLoading`/`error` dance (see existing actions), call the service, assign state.
2. Consume in a component via `storeToRefs` / direct store property — never import a service in a component.

## Add offline state

1. Type in `src/types/indexeddb.ts` if new shape.
2. Helper in `dbService` (`src/db/indexdb.ts`) — raw `idb` calls stay inside this file.
3. Action in `offlineStore` that calls the helper then updates its in-memory mirror (same names as DB contents). Components read the store.

## Change the IndexedDB schema (stores, keys, indexes)

1. Bump `DB_VERSION` in `src/db/indexdb.ts`.
2. Extend `MangaReaderDB` interface (key/value/indexes) — `idb` type-checks against it.
3. In `upgrade(db, oldVersion)`, guard every change (`if (!db.objectStoreNames.contains(...))` / version-gated blocks); existing installs must upgrade without data loss. The current `upgrade` is idempotent per-store — keep that property.
4. Update `architecture.md` store table if a store/index/key changes.

## Add a real-time feature

- Downloads/updates state arrives via `realtimeService` WebSockets. Subscribe in a store or long-lived component with `realtimeService.onDownloadUpdate(cb)` / `onUpdateMessage(cb)` — both return an unsubscribe function; call it on teardown. Connection status via `onDownloadStatusChange` / `onUpdateStatusChange`. There is no reconnect — handle `onclose` yourself if needed.

## Verify a change

```bash
bunx vue-tsc -b        # type gate (what CI/build runs first)
bun run build          # full gate; also catches the SFC script attr trap
bun run dev            # manual: http://localhost:5173
```

No test suite exists; `vue-tsc` + running the dev console (App.vue) is the verification loop. App.vue is a dev console exercising the offline store — extend it (or add a component + Navbar wiring) when you need a manual surface for a new feature.
