# Suwayomi-Server API Contract Specification

Dokumen ini berisi spesifikasi kontrak API lengkap untuk Suwayomi-Server, mencakup format request body, respons sukses (success body), respons gagal (error body), HTTP status code, serta skema data untuk setiap endpoint.

---

## 1. Konvensi & Protokol Umum

### Base URL
- REST API v1: `http://<host>:<port>/api/v1`
- GraphQL: `http://<host>:<port>/api/graphql`
- OPDS v1.2: `http://<host>:<port>/api/opds/v1.2`

### Format Error Contract
Suwayomi-Server menangani error melalui Javalin exception handler dengan dua format utama:

#### A. Javalin Standard JSON Error (Default untuk `HttpResponseException` seperti `NotFoundResponse`, `UnauthorizedResponse`)
```json
{
  "title": "Not Found",
  "status": 404,
  "type": "https://javalin.io/documentation#notfoundresponse",
  "details": {}
}
```

#### B. Exception Handler Error Body (Text / Plain)
Server mengembalikan HTTP Status dan pesan teks jika terjadi exception internal:
- **`400 Bad Request`**: Dihasilkan saat validasi parameter / JSON decoding gagal (`IllegalArgumentException`). Content-Type: `text/plain`, Body: string pesan error atau `"Bad Request"`.
- **`401 Unauthorized`**: Dihasilkan jika request membutuhkan autentikasi namun tidak menyertakan kredensial valid. Header `WWW-Authenticate: Basic` disertakan pada mode `BASIC_AUTH`. Body: `"Unauthorized"`.
- **`403 Forbidden`**: Dihasilkan jika user tidak memiliki hak akses (`ForbiddenException`). Body: `"Forbidden"`.
- **`404 Not Found`**: Dihasilkan jika entity (manga, chapter, source) tidak ditemukan (`NullPointerException`, `NoSuchElementException`, atau path salah). Body kosong atau 404 page.
- **`500 Internal Server Error`**: Dihasilkan jika terjadi error IO / network ke source extension (`IOException`). Body: string pesan error atau `"Internal Server Error"`.

---

## 2. Skema Entitas Data (Data Models)

### `MangaDataClass`
```json
{
  "id": 1,
  "sourceId": "8123456789012345678",
  "url": "/manga/one-piece",
  "title": "One Piece",
  "thumbnailUrl": "/api/v1/manga/1/thumbnail",
  "thumbnailUrlLastFetched": 1726700000,
  "initialized": true,
  "artist": "Eiichiro Oda",
  "author": "Eiichiro Oda",
  "description": "Gol D. Roger was known as the 'Pirate King'...",
  "genre": ["Action", "Adventure", "Fantasy"],
  "status": "ONGOING",
  "inLibrary": true,
  "inLibraryAt": 1726700000,
  "source": { ...SourceDataClass... },
  "realUrl": "https://example.com/manga/one-piece",
  "lastFetchedAt": 1726700000,
  "chaptersLastFetchedAt": 1726700000,
  "updateStrategy": "ALWAYS_UPDATE",
  "freshData": false,
  "unreadCount": 5,
  "downloadCount": 10,
  "chapterCount": 1100,
  "lastReadAt": 1726705000,
  "lastChapterRead": { ...ChapterDataClass... },
  "age": 3600,
  "chaptersAge": 3600,
  "trackers": [ ...MangaTrackerDataClass... ],
  "lastModifiedAt": 1726705000,
  "version": 1,
  "meta": { "key": "value" }
}
```

### `ChapterDataClass`
```json
{
  "id": 101,
  "url": "/manga/one-piece/chapter-1",
  "name": "Chapter 1 - Romance Dawn",
  "uploadDate": 870000000000,
  "chapterNumber": 1.0,
  "scanlator": "ScanGroup",
  "mangaId": 1,
  "read": true,
  "bookmarked": false,
  "lastPageRead": 25,
  "lastReadAt": 1726705000,
  "index": 1,
  "fetchedAt": 1726700000,
  "realUrl": "https://example.com/manga/one-piece/chapter-1",
  "downloaded": true,
  "pageCount": 52,
  "lastModifiedAt": 1726705000,
  "version": 1,
  "chapterCount": 1100,
  "meta": { "key": "value" }
}
```

### `SourceDataClass`
```json
{
  "id": "8123456789012345678",
  "name": "MangaDex",
  "lang": "en",
  "iconUrl": "/api/v1/extension/icon/eu.kanade.tachiyomi.extension.en.mangadex",
  "supportsLatest": true,
  "isConfigurable": true,
  "isNsfw": false,
  "displayName": "MangaDex (EN)",
  "baseUrl": "https://mangadex.org"
}
```

### `CategoryDataClass`
```json
{
  "id": 1,
  "order": 0,
  "name": "Manga Favorit",
  "default": true,
  "includeInUpdate": 1,
  "includeInDownload": 1,
  "version": 1,
  "uid": 123456789,
  "lastModifiedAt": 1726700000,
  "size": 12,
  "meta": {}
}
```
*Catatan `includeInUpdate` & `includeInDownload`*: `1` (INCLUDE), `0` (EXCLUDE), `-1` (UNSET).

### `ExtensionDataClass`
```json
{
  "repo": "https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json",
  "apkName": "tachiyomi-en.mangadex-v1.4.1.apk",
  "iconUrl": "/api/v1/extension/icon/eu.kanade.tachiyomi.extension.en.mangadex",
  "name": "MangaDex",
  "pkgName": "eu.kanade.tachiyomi.extension.en.mangadex",
  "versionName": "1.4.1",
  "versionCode": 1401,
  "lang": "en",
  "isNsfw": false,
  "installed": true,
  "hasUpdate": false,
  "obsolete": false
}
```

---

## 3. Kontrak API: Source & Filter Module

### 3.1. Ambil Struktur Filter Source
- **Method & Path**: `GET /api/v1/source/{sourceId}/filters`
- **Path Params**: `sourceId` *(Long / String)* — ID Source.
- **Query Params**: `reset` *(Boolean, opsional, default: `false`)* — Jika `true`, reset state ke default.
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "type": "Header",
      "filter": {
        "name": "Sort By"
      }
    },
    {
      "type": "Select",
      "filter": {
        "name": "Order",
        "values": ["Popularity", "Latest", "Alphabetical"],
        "state": 0
      }
    },
    {
      "type": "Group",
      "filter": {
        "name": "Genres",
        "state": [
          {
            "type": "TriState",
            "name": "Action",
            "state": 0
          },
          {
            "type": "TriState",
            "name": "Romance",
            "state": 1
          }
        ]
      }
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`
  - `404 Not Found` — Source tidak ditemukan.

---

### 3.2. Set / Update Filter Source
- **Method & Path**: `POST /api/v1/source/{sourceId}/filters`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**: Array `FilterChange` atau Single object `FilterChange`:
  ```json
  [
    {
      "position": 1,
      "state": "2"
    },
    {
      "position": 2,
      "state": "{\"position\": 0, \"state\": \"1\"}"
    }
  ]
  ```
- **Success Response (`200 OK`)**: Status code 200 (Body kosong).
- **Error Responses**:
  - `400 Bad Request` — JSON invalid atau indeks posisi tidak valid.
  - `401 Unauthorized`
  - `404 Not Found` — Source ID tidak ditemukan.

---

### 3.3. Search Manga dengan Filter Tersimpan
- **Method & Path**: `GET /api/v1/source/{sourceId}/search`
- **Query Params**:
  - `searchTerm` *(String, default: `""`)*
  - `pageNum` *(Int, default: `1`)*
- **Success Response (`200 OK`)**:
  ```json
  {
    "mangaList": [
      { ...MangaDataClass... }
    ],
    "hasNextPage": true
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error` — HTTP request extension ke sumber web gagal / Cloudflare block.

---

### 3.4. Quick Search (Stateless Search + Filter Sekaligus)
- **Method & Path**: `POST /api/v1/source/{sourceId}/quick-search`
- **Query Params**: `pageNum` *(Int, default: `1`)*
- **Request Body** (`FilterData`):
  ```json
  {
    "searchTerm": "Solo Leveling",
    "filter": [
      {
        "position": 1,
        "state": "0"
      }
    ]
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "mangaList": [
      { ...MangaDataClass... }
    ],
    "hasNextPage": false
  }
  ```
- **Error Responses**:
  - `400 Bad Request` — Format payload invalid.
  - `401 Unauthorized`
  - `500 Internal Server Error` — Extension search gagal.

---

### 3.5. Source List, Detail, Popular, & Latest
- **`GET /api/v1/source/list`**
  - **Success (`200 OK`)**: Array `[ { ...SourceDataClass... } ]`
- **`GET /api/v1/source/{sourceId}`**
  - **Success (`200 OK`)**: `{ ...SourceDataClass... }`
  - **Error (`404 Not Found`)**
- **`GET /api/v1/source/{sourceId}/popular/{pageNum}`**
  - **Success (`200 OK`)**: `{ "mangaList": [...], "hasNextPage": boolean }`
- **`GET /api/v1/source/{sourceId}/latest/{pageNum}`**
  - **Success (`200 OK`)**: `{ "mangaList": [...], "hasNextPage": boolean }`

---

## 4. Kontrak API: Manga & Chapter Module

### 4.1. Manga Detail & Fetch
- **`GET /api/v1/manga/{mangaId}?onlineFetch=true|false`**
  - **Success (`200 OK`)**: `{ ...MangaDataClass... }`
  - **Error (`404 Not Found`)**
- **`GET /api/v1/manga/{mangaId}/full?onlineFetch=true|false`**
  - **Success (`200 OK`)**: `{ ...MangaDataClass... }` (semua chapter dan tracker terisi)
- **`GET /api/v1/manga/{mangaId}/thumbnail`**
  - **Success (`200 OK`)**: Binary image data (`Content-Type: image/jpeg` atau `image/png`).
  - **Headers**: `Cache-Control: max-age=86400`
- **`PATCH /api/v1/manga/{mangaId}/meta`**
  - **Request Body** (`application/x-www-form-urlencoded`): `key=myKey&value=myValue`
  - **Success (`200 OK`)**

### 4.2. Library & Kategori Manga
- **`GET /api/v1/manga/{mangaId}/library`** — Tambah ke library.
  - **Success (`200 OK`)**
- **`DELETE /api/v1/manga/{mangaId}/library`** — Hapus dari library.
  - **Success (`200 OK`)**
- **`GET /api/v1/manga/{mangaId}/category`** — Ambil kategori tempat manga berada.
  - **Success (`200 OK`)**: `[ { ...CategoryDataClass... } ]`
- **`GET /api/v1/manga/{mangaId}/category/{categoryId}`** — Masukkan manga ke kategori.
  - **Success (`200 OK`)**
- **`DELETE /api/v1/manga/{mangaId}/category/{categoryId}`** — Hapus manga dari kategori.
  - **Success (`200 OK`)**

### 4.3. Chapters
- **`GET /api/v1/manga/{mangaId}/chapters?onlineFetch=false`**
  - **Success (`200 OK`)**: `[ { ...ChapterDataClass... } ]`
- **`GET /api/v1/manga/{mangaId}/chapter/{chapterIndex}`**
  - **Success (`200 OK`)**: `{ ...ChapterDataClass... }`
- **`PATCH` / `PUT /api/v1/manga/{mangaId}/chapter/{chapterIndex}`**
  - **Request Body** (`application/x-www-form-urlencoded`):
    - `read` *(boolean, optional)*
    - `bookmarked` *(boolean, optional)*
    - `lastPageRead` *(int, optional)*
    - `markPrevRead` *(boolean, optional)*
  - **Success (`200 OK`)**
- **`DELETE /api/v1/manga/{mangaId}/chapter/{chapterIndex}`** — Hapus unduhan chapter.
  - **Success (`200 OK`)**
- **`GET /api/v1/manga/{mangaId}/chapter/{chapterIndex}/page/{index}?updateProgress=true`**
  - **Success (`200 OK`)**: Image binary stream (`image/jpeg`, `image/png`, `image/webp`).

### 4.4. Batch Chapter Operations
- **`POST /api/v1/manga/{mangaId}/chapter/batch`**
  - **Request Body** (`application/json`):
    ```json
    {
      "chapterIds": [101, 102, 103],
      "chapterIndexes": null,
      "change": {
        "isRead": true,
        "isBookmarked": false,
        "lastPageRead": null,
        "delete": false
      }
    }
    ```
  - **Success (`200 OK`)**
- **`POST /api/v1/chapter/batch`** (Lintas manga)
  - **Request Body** (`application/json`):
    ```json
    {
      "chapterIds": [101, 205],
      "change": {
        "isRead": true
      }
    }
    ```
  - **Success (`200 OK`)**

### 4.5. Download Chapter File (CBZ)
- **`GET /api/v1/chapter/{chapterId}/download?markAsRead=false`**
  - **Success (`200 OK`)**: Binary `.cbz` file (`application/vnd.comicbook+zip` atau `application/octet-stream`).
  - **Headers**: `Content-Disposition: attachment; filename="..."`
- **`HEAD /api/v1/chapter/{chapterId}/download`**
  - **Success (`200 OK`)**: Header metadata CBZ (`Content-Length`, `Content-Type`, `Content-Disposition`).

---

## 5. Kontrak API: Category Module

- **`GET /api/v1/category`**
  - **Success (`200 OK`)**: `[ { ...CategoryDataClass... } ]`
- **`POST /api/v1/category`**
  - **Request Body** (`form-urlencoded`): `name=My+Category`
  - **Success (`200 OK`)**
  - **Error (`400 Bad Request`)** — Nama kosong atau kategori sudah ada.
- **`PATCH /api/v1/category/reorder`**
  - **Request Body** (`form-urlencoded`): `from=0&to=2`
  - **Success (`200 OK`)**
- **`GET /api/v1/category/{categoryId}`**
  - **Success (`200 OK`)**: Array manga di kategori `[ { ...MangaDataClass... } ]`
- **`PATCH /api/v1/category/{categoryId}`**
  - **Request Body** (`form-urlencoded`):
    - `name` *(string, optional)*
    - `default` *(boolean, optional)*
    - `includeInUpdate` *(int: 1/0/-1, optional)*
    - `includeInDownload` *(int: 1/0/-1, optional)*
  - **Success (`200 OK`)**
- **`DELETE /api/v1/category/{categoryId}`**
  - **Success (`200 OK`)**

---

## 6. Kontrak API: Extension Module

- **`GET /api/v1/extension/list`**
  - **Success (`200 OK`)**: `[ { ...ExtensionDataClass... } ]`
- **`GET /api/v1/extension/install/{pkgName}`**
  - **Success (`201 Created`)**
  - **Error (`302 Found` / `500 Internal Server Error`)**
- **`POST /api/v1/extension/install`**
  - **Content-Type**: `multipart/form-data`
  - **Form Field**: `file` (File `.apk`)
  - **Success (`201 Created`)**
- **`GET /api/v1/extension/update/{pkgName}`**
  - **Success (`201 Created`)**
  - **Error (`404 Not Found`)**
- **`GET /api/v1/extension/uninstall/{pkgName}`**
  - **Success (`200 OK`)**
- **`GET /api/v1/extension/icon/{pkgName}`**
  - **Success (`200 OK`)**: Binary image icon APK (`image/png`).

---

## 7. Kontrak API: Downloader Module

- **`GET /api/v1/downloads/start`** — Mulai download queue.
  - **Success (`200 OK`)**
- **`GET /api/v1/downloads/stop`** — Hentikan download queue.
  - **Success (`200 OK`)**
- **`GET /api/v1/downloads/clear`** — Bersihkan queue.
  - **Success (`200 OK`)**
- **`GET /api/v1/download/{mangaId}/chapter/{chapterIndex}`** — Antrekan 1 chapter.
  - **Success (`200 OK`)**
  - **Error (`404 Not Found`)**
- **`DELETE /api/v1/download/{mangaId}/chapter/{chapterIndex}`** — Batalkan antrean 1 chapter.
  - **Success (`200 OK`)**
- **`POST /api/v1/download/batch`** — Antrekan batch chapter.
  - **Request Body** (`application/json`):
    ```json
    {
      "chapterIds": [101, 102, 103]
    }
    ```
  - **Success (`200 OK`)**
- **`DELETE /api/v1/download/batch`** — Batalkan batch download.
  - **Request Body** (`application/json`): `{ "chapterIds": [101, 102] }`
  - **Success (`200 OK`)**

---

## 8. Kontrak API: Update Module

- **`GET /api/v1/update/recentChapters/{pageNum}`**
  - **Success (`200 OK`)**:
    ```json
    {
      "mangaChapterList": [
        {
          "manga": { ...MangaDataClass... },
          "chapter": { ...ChapterDataClass... }
        }
      ],
      "hasNextPage": false
    }
    ```
- **`POST /api/v1/update/fetch`**
  - **Request Body** (`form-urlencoded`): `categoryId=1` *(opsional, kosongkan untuk update seluruh library)*
  - **Success (`200 OK`)**
  - **Error (`400 Bad Request`)** — Kategori tidak ditemukan.
- **`POST /api/v1/update/reset`**
  - **Success (`200 OK`)**
- **`GET /api/v1/update/summary`**
  - **Success (`200 OK`)**:
    ```json
    {
      "categoryStatusMap": {},
      "mangaStatusMap": {},
      "running": false
    }
    ```

---

## 9. Kontrak API: Tracker Module (MyAnimeList / AniList / Kitsu)

- **`GET /api/v1/track/list`**
  - **Success (`200 OK`)**:
    ```json
    [
      {
        "id": 1,
        "name": "MyAnimeList",
        "icon": "mal.png",
        "isLogin": true,
        "authUrl": null
      }
    ]
    ```
- **`POST /api/v1/track/login`**
  - **Request Body** (`application/json`):
    ```json
    {
      "trackerId": 1,
      "callbackUrl": "https://...auth_callback",
      "username": "user",
      "password": "pass"
    }
    ```
  - **Success (`200 OK`)**
  - **Error (`404 Not Found`)** — Tracker id salah.
- **`POST /api/v1/track/logout`**
  - **Request Body** (`application/json`): `{ "trackerId": 1 }`
  - **Success (`200 OK`)**
- **`POST /api/v1/track/search`**
  - **Request Body** (`application/json`): `{ "trackerId": 1, "title": "Naruto" }`
  - **Success (`200 OK`)**: Array `[ { ...TrackSearchDataClass... } ]`
- **`POST /api/v1/track/bind?mangaId=1&trackerId=1&remoteId=12345&private=false`**
  - **Success (`200 OK`)**
- **`POST /api/v1/track/update`**
  - **Request Body** (`application/json`):
    ```json
    {
      "recordId": 5,
      "status": 1,
      "lastChapterRead": 25.0,
      "scoreString": "9",
      "startDate": 1726700000,
      "finishDate": 0,
      "unbind": false,
      "private": false
    }
    ```
  - **Success (`200 OK`)**

---

## 10. Kontrak API: Backup & Restore Module

- **`POST /api/v1/backup/import`**
  - **Body**: Raw Protobuf stream (`application/octet-stream`).
  - **Success (`200 OK`)**: `{ ...ValidationResult... }`
- **`POST /api/v1/backup/import/file`**
  - **Multipart Field**: `backup.proto.gz`
  - **Success (`200 OK`)**:
    ```json
    {
      "missingSources": [],
      "missingTrackers": [],
      "mangasMissingSources": []
    }
    ```
- **`POST /api/v1/backup/validate`** / **`POST /api/v1/backup/validate/file`**
  - **Success (`200 OK`)**: `{ ...ValidationResult... }`
- **`GET /api/v1/backup/export`** & **`GET /api/v1/backup/export/file`**
  - **Success (`200 OK`)**: Protobuf GZ stream (`Content-Type: application/octet-stream`).
  - **Headers**: `Content-Disposition: attachment; filename="suwayomi_backup_YYYY-MM-DD_HH-mm.proto.gz"`

---

## 11. Kontrak API: Settings, Meta & Webview

- **`GET /api/v1/meta`**
  - **Success (`200 OK`)**: Key-value map JSON `{ "key": "value" }`
- **`PATCH /api/v1/meta`**
  - **Body** (`form-urlencoded`): `key=someKey&value=someValue`
  - **Success (`200 OK`)**
- **`GET /api/v1/settings/about`**
  - **Success (`200 OK`)**:
    ```json
    {
      "name": "Suwayomi-Server",
      "version": "1.1.1",
      "revision": "1.1.1",
      "buildType": "Release",
      "buildTime": 1726700000000,
      "github": "https://github.com/Suwayomi/Suwayomi-Server",
      "discord": "https://discord.gg/DDZdqZWaHA"
    }
    ```
- **`GET /api/v1/settings/check-update`**
  - **Success (`200 OK`)**:
    ```json
    [
      {
        "channel": "Release",
        "tag": "v1.1.2",
        "url": "https://github.com/Suwayomi/Suwayomi-Server/releases/tag/v1.1.2"
      }
    ]
    ```

---

## 12. Kontrak Realtime: WebSockets

### 12.1. Download WebSocket (`WS /api/v1/downloads`)
- **Alur Koneksi**: Klien tersambung ke `ws://<host>:<port>/api/v1/downloads`.
- **Server Push**: Setiap ada perubahan queue/proses download, server mengirim JSON:
  ```json
  {
    "status": "DOWNLOADING",
    "queue": [
      {
        "chapter": { ...ChapterDataClass... },
        "manga": { ...MangaDataClass... },
        "progress": 75,
        "state": "DOWNLOADING"
      }
    ]
  }
  ```

### 12.2. Update WebSocket (`WS /api/v1/update`)
- **Client Commands**:
  - Kirim string `"STATUS"`: Server membalas dengan status update terkini.
- **Server Push**: Setiap kali ada manga baru yang sedang dicek atau update selesai, server mem-push `{ ...UpdateStatus... }`.

---

## 13. Kontrak GraphQL API (`/api/graphql`)

- **Endpoint**: `POST /api/graphql`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "query": "query GetMangas($first: Int) { mangas(first: $first) { nodes { id title status } totalCount } }",
    "variables": { "first": 10 }
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "mangas": {
        "nodes": [
          { "id": 1, "title": "One Piece", "status": "ONGOING" }
        ],
        "totalCount": 1
      }
    }
  }
  ```
- **Error Response (`200 OK` dengan errors array)**:
  ```json
  {
    "errors": [
      {
        "message": "Field 'invalidField' does not exist on type 'MangaType'",
        "locations": [{ "line": 1, "column": 30 }]
      }
    ]
  }
  ```
