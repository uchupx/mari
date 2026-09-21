# Manga Reader — Agent Handbook

Web client for a [Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server) manga library: browse sources, read chapters, track downloads/updates, and persist reading state offline in the browser. Vue 3 + TypeScript + Vite + Pinia + Tailwind v4 + daisyUI + IndexedDB (`idb`), developed and run with Bun. No router, no test suite.

## Reading map

| When | Read |
|------|------|
| Tracing data flow, server/offline split, DB schema, API error handling | [architecture.md](architecture.md) |
| Writing or reviewing code | [conventions.md](conventions.md) |
| Adding a service, store action, or IndexedDB store | [tasks.md](tasks.md) |
| "Does it build / what's wired up yet" | [project-state.md](project-state.md) |

## Sources of truth (do not restate, do not duplicate)

- **API shapes & endpoints**: `API-Contract.md` (Suwayomi REST + GraphQL + OPDS + WebSocket contract) — `src/types/api.ts` mirrors it.
- **Dependencies & scripts**: `package.json`. Runtime is Bun (`bun run dev` / `build` / `preview`).
- **IndexedDB schema**: `src/db/indexdb.ts` (`MangaReaderDB` interface is authoritative).
- **Server location**: `.env` → `SUWAYOMI_SERVER_URL` (empty = same origin). Consumed at module load by `apiClient`, `graphqlService`, `realtimeService`.
- **Vite aliases / dev server**: `vite.config.ts` (`@` → `src/`, port 5173).

## Hard invariants (violating these is a bug)

- Source IDs are 64-bit on the server → always `string` in TS (`SourceDataClass.id: string`). Never `number`.
- Every server call goes through `ApiClient` / `GraphQLService` — never raw `fetch` in components or stores.
- UI state lives only in Pinia stores; components never import services directly.
- IndexedDB schema changes MUST bump `DB_VERSION` and be guarded in `upgrade()` (see [tasks.md](tasks.md)).
