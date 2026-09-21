import type { ChapterDataClass, MangaDataClass } from './api';

export interface OfflineManga extends MangaDataClass {
  savedAt: number;
  lastSyncedAt?: number;
  customNotes?: string;
}

export interface OfflineChapter extends ChapterDataClass {
  savedAt: number;
  isOfflineAvailable: boolean;
}

export interface ReadingHistoryEntry {
  id: string; // `${mangaId}_${chapterId}`
  mangaId: number;
  chapterId: number;
  mangaTitle: string;
  mangaThumbnailUrl: string;
  chapterName: string;
  chapterIndex: number;
  lastPageRead: number;
  pageCount: number;
  // progressPercentage: number;
  readAt: number;
}

export interface BookmarkEntry {
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  chapterName: string;
  chapterNumber: number;
  bookmarkedAt: number;
}
