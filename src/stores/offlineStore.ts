import { defineStore } from 'pinia';
import { dbService } from '@/db/indexdb';
import type { BookmarkEntry, OfflineChapter, OfflineManga } from '@/types/indexeddb';
import type { ChapterDataClass, MangaDataClass } from '@/types/api';

export const useOfflineStore = defineStore('offline', {
  state: () => ({
    offlineMangas: [] as OfflineManga[],
    bookmarks: [] as BookmarkEntry[],
    activeMangaChapters: {} as Record<number, OfflineChapter[]>,
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
  }),

  getters: {
    savedCount: (state): number => state.offlineMangas.length,

    isMangaSaved: (state) => {
      return (mangaId: number): boolean => {
        return state.offlineMangas.some((m) => m.id === mangaId);
      };
    },

    isChapterBookmarked: (state) => {
      return (chapterId: number): boolean => {
        return state.bookmarks.some((b) => b.chapterId === chapterId);
      };
    },
  },

  actions: {
    /**
     * Inisialisasi data dari IndexedDB saat aplikasi start
     */
    async init(): Promise<void> {
      if (this.isInitialized) return;
      this.isLoading = true;
      this.error = null;

      try {
        // const [bookmarks] = await Promise.all([
        //   dbService.getAllMangas(),
        //   dbService.getAllBookmarks(),
        // ]);

        // this.bookmarks = bookmarks;
        this.isInitialized = true;
      } catch (err: any) {
        this.error = err?.message || 'Failed to initialize IndexedDB store';
        console.error('[OfflineStore] Init error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Simpan Manga & daftar chapternya ke IndexedDB
     */
    async saveMangaOffline(manga: MangaDataClass, chapters: ChapterDataClass[] = []): Promise<void> {
      this.isLoading = true;
      try {
        const offlineManga: OfflineManga = {
          ...manga,
          savedAt: Date.now(),
          lastSyncedAt: Date.now(),
        };

        await dbService.saveManga(offlineManga);

        if (chapters.length > 0) {
          const offlineChapters: OfflineChapter[] = chapters.map((ch) => ({
            ...ch,
            savedAt: Date.now(),
            isOfflineAvailable: true,
          }));
          await dbService.saveChapters(offlineChapters);
          this.activeMangaChapters[manga.id] = offlineChapters;
        }

        // Update reactive state
        const index = this.offlineMangas.findIndex((m) => m.id === manga.id);
        if (index >= 0) {
          this.offlineMangas[index] = offlineManga;
        } else {
          this.offlineMangas.unshift(offlineManga);
        }
      } catch (err: any) {
        this.error = `Failed to save manga ${manga.title} offline: ${err.message}`;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Hapus manga offline dari IndexedDB
     */
    async removeMangaOffline(mangaId: number): Promise<void> {
      this.isLoading = true;
      try {
        await dbService.deleteManga(mangaId);
        this.offlineMangas = this.offlineMangas.filter((m) => m.id !== mangaId);
        delete this.activeMangaChapters[mangaId];
      } catch (err: any) {
        this.error = `Failed to remove manga offline: ${err.message}`;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Muat chapter dari IndexedDB untuk manga tertentu
     */
    async loadChapters(mangaId: number): Promise<OfflineChapter[]> {
      try {
        const chapters = await dbService.getChaptersForManga(mangaId);
        this.activeMangaChapters[mangaId] = chapters;
        return chapters;
      } catch (err: any) {
        this.error = `Failed to load offline chapters: ${err.message}`;
        return [];
      }
    },

    /**
     * Toggle bookmark chapter
     */
    async toggleBookmark(
      manga: Pick<MangaDataClass, 'id' | 'title'>,
      chapter: Pick<ChapterDataClass, 'id' | 'name' | 'chapterNumber'>
    ): Promise<boolean> {
      const isBookmarked = this.isChapterBookmarked(chapter.id);
      try {
        if (isBookmarked) {
          await dbService.removeBookmark(chapter.id);
          this.bookmarks = this.bookmarks.filter((b) => b.chapterId !== chapter.id);
          return false;
        } else {
          const entry: BookmarkEntry = {
            chapterId: chapter.id,
            mangaId: manga.id,
            mangaTitle: manga.title,
            chapterName: chapter.name,
            chapterNumber: chapter.chapterNumber,
            bookmarkedAt: Date.now(),
          };
          await dbService.addBookmark(entry);
          this.bookmarks.unshift(entry);
          return true;
        }
      } catch (err: any) {
        this.error = `Failed to toggle bookmark: ${err.message}`;
        throw err;
      }
    },

    /**
     * Hapus semua cache data offline
     */
    async clearAll(): Promise<void> {
      this.isLoading = true;
      try {
        await dbService.clearDatabase();
        this.offlineMangas = [];
        this.bookmarks = [];
        this.activeMangaChapters = {};
      } catch (err: any) {
        this.error = `Failed to clear offline database: ${err.message}`;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
