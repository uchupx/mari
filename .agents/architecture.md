# Architecture

Two data planes meet in the Pinia stores:

```
Suwayomi-Server (REST /api/v1, GraphQL /api/graphql, WS /api/v1/{downloads,update})
        │  services/ (stateless, typed wrappers)
        ▼
Pinia stores ── mangaStore (online) ── offlineStore (offline mirror)
        │                                    │
        ▼                                    ▼
   Components                       IndexedDB (idb wrapper in db/indexdb.ts)
```

## Layers

**`src/services/`** — one stateless class per API domain, each taking an `ApiClient` and exported as a singleton (`mangaService`, `sourceService`, …). They map 1:1 onto the endpoint groups in `API-Contract.md`. Notable members:

- `apiClient.ts` — the only HTTP path. `request<T>()` handles: URL query building, body encoding (JSON default, `isUrlEncoded` → `x-www-form-urlencoded`, `isMultipart` for FormData), `responseType` (`json` | `blob` | `text` | `void`), and error normalization — every non-2xx becomes `SuwayomiApiError` (status, message, details, type) regardless of whether the server sent Javalin JSON or plain text. Network failures become `SuwayomiApiError(0, ...)`.
- `graphqlService.ts` — standalone POST to `/api/graphql` (does not go through `ApiClient`).
- `realtimeService.ts` — two WebSockets: `/api/v1/downloads` and `/api/v1/update`. Listener-set pattern (`onDownloadUpdate` / `onUpdateMessage` return unsubscribe functions); the update socket sends `'STATUS'` on open and on `requestUpdateStatus()`. No auto-reconnect.

**`src/stores/`** — the only state owners.

- `mangaStore` (online): server health/`serverVersion`, sources, popular/search results, current manga + chapters, categories. Pattern per action: set `isLoading`/clear `error` → call service → assign state → catch into `this.error` (message string) → `finally` reset `isLoading`.
- `offlineStore` (offline): in-memory mirror of the IndexedDB contents, hydrated by `init()` on app start. Writes go through `dbService` then update state. Getters: `savedCount`, `isMangaSaved`, `isChapterBookmarked`, `recentHistory` (last 10).

**`src/db/indexdb.ts`** — `idb` wrapper, singleton promise via `getDb()`. DB `manga-reader-db`, version 1, four stores:

| store | key | indexes |
|---|---|---|
| `mangas` | `id` (number) | `by-title`, `by-source`, `by-savedAt` |
| `chapters` | `id` (number) | `by-manga`, `by-chapterNumber` |
| `readingHistory` | `` `${mangaId}_${chapterId}` `` (string) | `by-manga`, `by-readAt` |
| `bookmarks` | `chapterId` (number) | `by-manga`, `by-bookmarkedAt` |

All mutations funnel through the `dbService` object; stores never touch `idb` directly.

**`src/types/`** — `api.ts` mirrors `API-Contract.md` (entity classes, WS message types, payloads); `indexeddb.ts` defines offline variants: `OfflineManga extends MangaDataClass` (+`savedAt`, `lastSyncedAt`, `customNotes`), `OfflineChapter extends ChapterDataClass` (+`savedAt`, `isOfflineAvailable`), `ReadingHistoryEntry`, `BookmarkEntry`.

## Design decisions worth keeping

- **64-bit source IDs as strings.** Server `Long` overflows JS numbers; `SourceDataClass.id` is `string` everywhere. Manga/chapter IDs are smaller and stay `number`.
- **Single error type.** Components/stores only ever see `SuwayomiApiError` or store-level `error: string` — the Javalin-vs-text error format split is absorbed in `apiClient.request()`.
- **Offline-first mirror, not sync.** `offlineStore` keeps its own copies (`OfflineManga`/`OfflineChapter`) and never writes back to the server; server progress updates flow only through REST (`?updateProgress=` on page URLs). There is no sync/reconciliation layer yet.
- **Demo-mode tolerance.** The app mounts and initializes IndexedDB even when the server is unreachable (`checkServerHealth` catch → `serverConnected = false`); offline actions are designed to work without it.
