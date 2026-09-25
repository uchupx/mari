import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BookmarkEntry, OfflineChapter, OfflineManga, ReadingHistoryEntry } from '@/types/indexeddb';
import { MangaDataClass } from '@/types/api';

export const DB_NAME = 'manga-reader-db';
export const DB_VERSION = 1;

export interface MangaReaderDB extends DBSchema {
  mangas: {
    key: number;
    value: MangaDataClass;
    indexes: {
      'by-title': string;
      'by-source': string;
      'by-savedAt': number;
    };
  };
  chapters: {
    key: number;
    value: OfflineChapter;
    indexes: {
      'by-manga': number;
      'by-chapterNumber': number;
    };
  };
  readingHistory: {
    key: string; // `${mangaId}_${chapterId}`
    value: ReadingHistoryEntry;
    indexes: {
      'by-manga': number;
      'by-readAt': number;
    };
  };
  bookmarks: {
    key: number; // chapterId
    value: BookmarkEntry;
    indexes: {
      'by-manga': number;
      'by-bookmarkedAt': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MangaReaderDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<MangaReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MangaReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Mangas Store
        if (!db.objectStoreNames.contains('mangas')) {
          const mangaStore = db.createObjectStore('mangas', { keyPath: 'id' });
          mangaStore.createIndex('by-title', 'title');
          mangaStore.createIndex('by-source', 'sourceId');
          mangaStore.createIndex('by-savedAt', 'savedAt');
        }

        // Chapters Store
        if (!db.objectStoreNames.contains('chapters')) {
          const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
          chapterStore.createIndex('by-manga', 'mangaId');
          chapterStore.createIndex('by-chapterNumber', 'chapterNumber');
        }

        // Reading History Store
        if (!db.objectStoreNames.contains('readingHistory')) {
          const historyStore = db.createObjectStore('readingHistory', { keyPath: 'id' });
          historyStore.createIndex('by-manga', 'mangaId');
          historyStore.createIndex('by-readAt', 'readAt');
        }

        // Bookmarks Store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'chapterId' });
          bookmarkStore.createIndex('by-manga', 'mangaId');
          bookmarkStore.createIndex('by-bookmarkedAt', 'bookmarkedAt');
        }
      },
    });
  }

  return dbPromise;
}

// ==========================================
// Database Helpers
// ==========================================

export const dbService = {
  // --- Manga ---
  async saveManga(manga: MangaDataClass): Promise<void> {
    const db = await getDb();
    console.log(manga);
    await db.put('mangas', manga);
  },

  async getManga(id: number): Promise<MangaDataClass | undefined> {
    const db = await getDb();
    return db.get('mangas', id);
  },

  async getAllMangas(): Promise<MangaDataClass[]> {
    const db = await getDb();
    return db.getAllFromIndex('mangas', 'by-title');
  },

  async deleteManga(id: number): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(['mangas', 'chapters', 'readingHistory', 'bookmarks'], 'readwrite');
    await tx.objectStore('mangas').delete(id);

    // Clean up associated chapters
    const chapterIndex = tx.objectStore('chapters').index('by-manga');
    let cursor = await chapterIndex.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  },

  // --- Chapters ---
  async saveChapters(chapters: OfflineChapter[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('chapters', 'readwrite');
    for (const chapter of chapters) {
      await tx.store.put(chapter);
    }
    await tx.done;
  },

  async getChaptersForManga(mangaId: number): Promise<OfflineChapter[]> {
    const db = await getDb();
    return db.getAllFromIndex('chapters', 'by-manga', mangaId);
  },

  // --- Reading History ---
  async saveReadingHistory(entry: ReadingHistoryEntry): Promise<void> {
    const db = await getDb();
    await db.put('readingHistory', entry);
  },

  async getReadingHistory(): Promise<ReadingHistoryEntry[]> {
    const db = await getDb();
    const list = await db.getAllFromIndex('readingHistory', 'by-readAt');
    return list.reverse(); // Most recent first
  },

  async deleteReadingHistoryEntry(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('readingHistory', id);
  },
  async clearReadingHistory(): Promise<void> {
    const db = await getDb();
    await db.clear('readingHistory');
  },

  // --- Bookmarks ---
  async addBookmark(entry: BookmarkEntry): Promise<void> {
    const db = await getDb();
    await db.put('bookmarks', entry);
  },

  async removeBookmark(chapterId: number): Promise<void> {
    const db = await getDb();
    await db.delete('bookmarks', chapterId);
  },

  async getAllBookmarks(): Promise<BookmarkEntry[]> {
    const db = await getDb();
    const list = await db.getAllFromIndex('bookmarks', 'by-bookmarkedAt');
    return list.reverse();
  },

  async isChapterBookmarked(chapterId: number): Promise<boolean> {
    const db = await getDb();
    const found = await db.get('bookmarks', chapterId);
    return !!found;
  },

  // --- Maintenance ---
  async clearDatabase(): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(['mangas', 'chapters', 'readingHistory', 'bookmarks'], 'readwrite');
    await tx.objectStore('mangas').clear();
    await tx.objectStore('chapters').clear();
    await tx.objectStore('readingHistory').clear();
    await tx.objectStore('bookmarks').clear();
    await tx.done;
  },
};
