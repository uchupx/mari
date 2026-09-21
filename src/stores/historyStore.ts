import { defineStore } from 'pinia';
import { historyService } from '@/services/historyService';
import type { ReadingHistoryEntry } from '@/types/indexeddb';
import type { ChapterDataClass, MangaDataClass } from '@/types/api';

/**
 * Human-readable message from an unknown thrown value. `idb` throws
 * DOMException (an Error subclass in modern browsers) — use its `.message`;
 * anything else falls back.
 */
function toErrorMessage(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : '';
  return message || fallback;
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: [] as ReadingHistoryEntry[],
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
  }),

  getters: {
    /**
     * Continue-reading shelf: the latest entry per manga (newest first).
     */
    continueReading(state): ReadingHistoryEntry[] {
      return historyService.latestPerManga(state.history);
    },

    historyCount: (state): number => state.history.length,

    /**
     * Resume-point lookup for a specific chapter.
     */
    getEntry(state) {
      return (mangaId: number, chapterId: number): ReadingHistoryEntry | undefined => {
        return state.history.find((h) => h.id === `${mangaId}_${chapterId}`);
      };
    },

    /**
     * All chapters of one manga with recorded progress, newest first.
     */
    getByManga(state) {
      return (mangaId: number): ReadingHistoryEntry[] => {
        return state.history.filter((h) => h.mangaId === mangaId);
      };
    },
  },

  actions: {
    /**
     * Hydrate from IndexedDB once on app start.
     */
    async init(): Promise<void> {
      if (this.isInitialized) return;
      this.isLoading = true;
      this.error = null;

      try {
        this.history = await historyService.getAll();
        this.isInitialized = true;
      } catch (err: unknown) {
        this.error = toErrorMessage(err, 'Failed to initialize reading history');
        console.error('[HistoryStore] Init error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Record reading progress for a chapter page. Upserts the manga+chapter
     * resume point in IndexedDB and in-memory state.
     */
    async recordProgress(
      manga: Pick<MangaDataClass, 'id' | 'title' | 'thumbnailUrl' | 'sourceId'>,
      chapter: Pick<ChapterDataClass, 'id' | 'name' | 'chapterNumber' | 'index' | 'pageCount'>,
      page: number
    ): Promise<void> {
      try {
        const entry = historyService.buildEntry(manga, chapter, page);
        console.log('[HistoryStore] built entry:', entry);
        await historyService.save(entry); // db.put() is already an upsert — no need to remove first
        console.log('[HistoryStore] entry saved to IndexedDB');

        console.log(await historyService.getById(entry.id))
        this.history = this.history.filter((h) => h.id !== entry.id);
        this.history.unshift(entry);
        console.log('[HistoryStore] in-memory history updated, total entries:', this.history.length);
      } catch (err: unknown) {
        this.error = `Failed to record reading progress: ${toErrorMessage(err, 'unknown error')}`;
        console.error('[HistoryStore] Record error:', err);
      }
    },

    /**
     * Remove a single history entry by its `${mangaId}_${sourceId}` key.
     */
    async removeEntry(id: string): Promise<void> {
      try {
        await historyService.remove(id);
        this.history = this.history.filter((h) => h.id !== id);
      } catch (err: unknown) {
        this.error = `Failed to remove history entry: ${toErrorMessage(err, 'unknown error')}`;
        throw err;
      }
    },

    /**
     * Delete every history entry (IndexedDB + state).
     */
    async clearAll(): Promise<void> {
      try {
        await historyService.clear();
        this.history = [];
      } catch (err: unknown) {
        this.error = `Failed to clear reading history: ${toErrorMessage(err, 'unknown error')}`;
        throw err;
      }
    },
  },
});
