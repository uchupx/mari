/**
 * Suwayomi-Server API Contract TypeScript Definitions
 * Based on API-Contract.md
 */

// ==========================================
// 1. Error Contracts
// ==========================================

export interface JavalinErrorResponse {
  title: string;
  status: number;
  type?: string;
  details?: Record<string, unknown>;
}

export class SuwayomiApiError extends Error {
  public status: number;
  public details?: Record<string, unknown>;
  public type?: string;

  constructor(status: number, message: string, details?: Record<string, unknown>, type?: string) {
    super(message);
    this.name = 'SuwayomiApiError';
    this.status = status;
    this.details = details;
    this.type = type;
  }
}

// ==========================================
// 2. Data Models (Entities)
// ==========================================

export type MangaStatus = 'ONGOING' | 'COMPLETED' | 'LICENSED' | 'PUBLISHING_FINISHED' | 'CANCELLED' | 'ON_HIATUS' | 'UNKNOWN';
export type UpdateStrategy = 'ALWAYS_UPDATE' | 'ONLY_FETCH_ONCE';

export interface MangaTrackerDataClass {
  id?: number;
  mangaId?: number;
  syncId?: number;
  libraryId?: number;
  title?: string;
  lastChapterRead?: number;
  totalChapters?: number;
  score?: number;
  status?: number;
  trackingUrl?: string;
}

export interface SourceDataClass {
  id: string; // Long ID stored as string in JS to avoid 64-bit int overflow
  name: string;
  lang: string;
  iconUrl: string;
  supportsLatest: boolean;
  isConfigurable: boolean;
  isNsfw: boolean;
  displayName: string;
  baseUrl: string;
}

export interface ChapterDataClass {
  id: number;
  url: string;
  name: string;
  uploadDate: number;
  chapterNumber: number;
  scanlator?: string;
  mangaId: number;
  read: boolean;
  bookmarked: boolean;
  lastPageRead: number;
  lastReadAt: number;
  index: number;
  fetchedAt: number;
  realUrl?: string;
  downloaded: boolean;
  pageCount: number;
  lastModifiedAt: number;
  version: number;
  chapterCount?: number;
  meta?: Record<string, string>;
}

export interface MangaDataClass {
  id: number;
  sourceId: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  thumbnailUrlLastFetched: number;
  initialized: boolean;
  artist?: string;
  author?: string;
  description?: string;
  genre: string[];
  status: MangaStatus | string;
  inLibrary: boolean;
  inLibraryAt?: number;
  source?: SourceDataClass;
  realUrl?: string;
  lastFetchedAt: number;
  chaptersLastFetchedAt: number;
  updateStrategy: UpdateStrategy | string;
  freshData: boolean;
  unreadCount: number;
  downloadCount: number;
  chapterCount: number;
  lastReadAt?: number;
  lastChapterRead?: ChapterDataClass;
  age?: number;
  chaptersAge?: number;
  trackers?: MangaTrackerDataClass[];
  lastModifiedAt: number;
  version: number;
  meta?: Record<string, string>;
  // Present when loaded with /full
  chapters?: ChapterDataClass[];
}

export type CategoryIncludeState = 1 | 0 | -1; // 1 = INCLUDE, 0 = EXCLUDE, -1 = UNSET

export interface CategoryDataClass {
  id: number;
  order: number;
  name: string;
  default: boolean;
  includeInUpdate: CategoryIncludeState;
  includeInDownload: CategoryIncludeState;
  version: number;
  uid: number;
  lastModifiedAt: number;
  size: number;
  meta?: Record<string, unknown>;
}

export interface ExtensionDataClass {
  repo: string;
  apkName: string;
  iconUrl: string;
  name: string;
  pkgName: string;
  versionName: string;
  versionCode: number;
  lang: string;
  isNsfw: boolean;
  installed: boolean;
  hasUpdate: boolean;
  obsolete: boolean;
}

// ==========================================
// 3. Source & Filter Module
// ==========================================

export interface FilterItem {
  type: 'Header' | 'Select' | 'Group' | 'TriState' | 'CheckBox' | 'Text' | 'Sort' | string;
  name?: string;
  state?: any;
  values?: string[];
  filter?: {
    name?: string;
    state?: any;
    values?: string[];
    [key: string]: any;
  };
}

export interface FilterChange {
  position: number;
  state: string;
}

export interface FilterData {
  searchTerm?: string;
  filter?: FilterChange[];
}

export interface MangaSearchResult {
  mangaList: MangaDataClass[];
  hasNextPage: boolean;
}

// ==========================================
// 4. Manga & Chapter Module
// ==========================================

export interface UpdateChapterPayload {
  read?: boolean;
  bookmarked?: boolean;
  lastPageRead?: number;
  markPrevRead?: boolean;
}

export interface BatchChapterChange {
  isRead?: boolean;
  isBookmarked?: boolean;
  lastPageRead?: number | null;
  delete?: boolean;
}

export interface BatchChapterRequest {
  chapterIds?: number[];
  chapterIndexes?: number[] | null;
  change: BatchChapterChange;
}

export interface CrossMangaBatchChapterRequest {
  chapterIds: number[];
  change: {
    isRead?: boolean;
  };
}

// ==========================================
// 5. Category Module
// ==========================================

export interface CreateCategoryPayload {
  name: string;
}

export interface ReorderCategoryPayload {
  from: number;
  to: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  default?: boolean;
  includeInUpdate?: CategoryIncludeState;
  includeInDownload?: CategoryIncludeState;
}

// ==========================================
// 6. Downloader Module
// ==========================================

export interface BatchDownloadRequest {
  chapterIds: number[];
}

export interface DownloadQueueItem {
  chapter: ChapterDataClass;
  manga: MangaDataClass;
  progress: number;
  state: 'DOWNLOADING' | 'QUEUE' | 'PAUSED' | 'ERROR' | string;
}

export interface DownloadWsMessage {
  status: 'DOWNLOADING' | 'PAUSED' | 'IDLE' | string;
  queue: DownloadQueueItem[];
}

// ==========================================
// 7. Update Module
// ==========================================

export interface MangaChapterPair {
  manga: MangaDataClass;
  chapter: ChapterDataClass;
}

export interface RecentChaptersResponse {
  mangaChapterList: MangaChapterPair[];
  hasNextPage: boolean;
}

export interface UpdateSummary {
  categoryStatusMap: Record<string, unknown>;
  mangaStatusMap: Record<string, unknown>;
  running: boolean;
}

export interface UpdateWsMessage {
  running: boolean;
  status?: string;
  categoryStatusMap?: Record<string, unknown>;
  mangaStatusMap?: Record<string, unknown>;
  [key: string]: unknown;
}

// ==========================================
// 8. Tracker Module
// ==========================================

export interface TrackerItem {
  id: number;
  name: string;
  icon: string;
  isLogin: boolean;
  authUrl: string | null;
}

export interface TrackerLoginRequest {
  trackerId: number;
  callbackUrl?: string;
  username?: string;
  password?: string;
}

export interface TrackSearchDataClass {
  id: number;
  mediaId: number;
  title: string;
  summary: string;
  score: number;
  status: number;
  totalChapters: number;
}

export interface TrackUpdateRequest {
  recordId: number;
  status?: number;
  lastChapterRead?: number;
  scoreString?: string;
  startDate?: number;
  finishDate?: number;
  unbind?: boolean;
  private?: boolean;
}

// ==========================================
// 9. Backup & Restore Module
// ==========================================

export interface BackupValidationResult {
  missingSources: string[];
  missingTrackers: string[];
  mangasMissingSources: string[];
}

// ==========================================
// 10. Settings & Meta Module
// ==========================================

export interface ServerAbout {
  name: string;
  version: string;
  revision: string;
  buildType: string;
  buildTime: number;
  github: string;
  discord: string;
}

export interface ServerUpdateCheck {
  channel: string;
  tag: string;
  url: string;
}

// ==========================================
// 11. GraphQL Module
// ==========================================

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
}
