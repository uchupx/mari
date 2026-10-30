import { defineStore } from 'pinia';
import { dbService } from '@/db/indexdb';
import { defaultApiClient } from '@/services/apiClient';
import { mangaService } from '@/services';
import type { ChapterDataClass, MangaDataClass } from '@/types/api';
import type { WorkerPool } from '@/workers/pool';

export interface ChapterProgressInfo {
  loaded: number;
  total: number;
  percent: number;
}

export const useDownloadStore = defineStore('download', {
  state: () => ({
    isDownloading: false,
    currentMangaId: null as number | null,
    mangaTitle: '',
    totalChapters: 0,
    completedChapters: 0,
    failedChapters: 0,
    currentChapterIndex: 0,
    currentChapterName: '',
    currentChapterPageIndex: 0,
    currentChapterTotalPages: 0,
    totalImages: 0,
    downloadedImages: 0,
    error: null as string | null,
    downloadedChapterIds: [] as number[],
    chapterProgress: {} as Record<number, ChapterProgressInfo>,
    _abortController: null as AbortController | null,
  }),

  getters: {
    progressPercent: (state): number => {
      if (state.totalImages > 0) {
        return Math.min(100, Math.round((state.downloadedImages / state.totalImages) * 100));
      }
      if (state.totalChapters > 0) {
        return Math.min(100, Math.round((state.completedChapters / state.totalChapters) * 100));
      }
      return 0;
    },

    isChapterDownloaded: (state) => {
      return (chapterId: number): boolean => {
        return state.downloadedChapterIds.includes(chapterId);
      };
    },

    isChapterDownloading: (state) => {
      return (chapterId: number): boolean => {
        return Boolean(state.chapterProgress[chapterId]);
      };
    },

    getChapterProgress: (state) => {
      return (chapterId: number): number => {
        return state.chapterProgress[chapterId]?.percent ?? 0;
      };
    },

    isDownloadingManga: (state) => {
      return (mangaId: number): boolean => {
        return state.isDownloading && state.currentMangaId === mangaId;
      };
    },
  },

  actions: {
    /**
     * Muat status chapter yang sudah terdownload dari IndexedDB
     */
    async refreshDownloadedChapters(mangaId: number): Promise<void> {
      try {
        const offlineChapters = await dbService.getChaptersForManga(mangaId);
        this.downloadedChapterIds = offlineChapters
          .filter((c) => c.isOfflineAvailable)
          .map((c) => c.id);
      } catch (err) {
        console.error('[DownloadStore] Failed to load offline chapters:', err);
      }
    },

    /**
     * Simpan metadata manga ke IndexedDB dan Cache Storage
     */
    async saveMangaOffline(manga: MangaDataClass): Promise<void> {
      const plainManga = JSON.parse(JSON.stringify(manga));
      await dbService.saveManga({
        ...plainManga,
        savedAt: Date.now(),
        hasUpdate: false,
      });

      if (typeof caches !== 'undefined') {
        try {
          const apiCache = await caches.open('api-cache');
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const mangaApiUrl = new URL(`${defaultApiClient.getBaseUrl()}/manga/${manga.id}`, origin).toString();
          await apiCache.put(
            mangaApiUrl,
            new Response(JSON.stringify(plainManga), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        } catch (e) {
          console.warn('[DownloadStore] Cache manga error:', e);
        }
      }
    },

    /**
     * Simpan detail chapter ke IndexedDB dan Cache Storage
     */
    async saveChapterOffline(mangaId: number, chapter: ChapterDataClass): Promise<void> {
      const plainChapter = JSON.parse(JSON.stringify(chapter));
      await dbService.saveChapters([
        {
          ...plainChapter,
          savedAt: Date.now(),
          isOfflineAvailable: true,
        },
      ]);

      if (typeof caches !== 'undefined') {
        try {
          const apiCache = await caches.open('api-cache');
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const chapterApiUrl = new URL(
            `${defaultApiClient.getBaseUrl()}/manga/${mangaId}/chapter/${chapter.index}`,
            origin
          ).toString();
          await apiCache.put(
            chapterApiUrl,
            new Response(JSON.stringify(plainChapter), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        } catch (e) {
          console.warn('[DownloadStore] Cache chapter error:', e);
        }
      }
    },

    /**
     * Download atau Retry Download single chapter (tidak memicu summary global)
     */
    async downloadSingleChapter(
      manga: MangaDataClass,
      chapter: ChapterDataClass,
      pool: WorkerPool
    ): Promise<boolean> {
      if (this.isDownloading) {
        console.warn('[DownloadStore] Download All is currently in progress.');
        return false;
      }

      if (this.chapterProgress[chapter.id]) {
        console.warn(`[DownloadStore] Chapter ${chapter.id} is already downloading.`);
        return false;
      }

      // Inisialisasi progress untuk chapter ini
      this.chapterProgress[chapter.id] = {
        loaded: 0,
        total: chapter.pageCount || 1,
        percent: 0,
      };

      try {
        await this.saveMangaOffline(manga);

        let chapterDetail = chapter;
        if (!chapterDetail.pageCount || chapterDetail.pageCount <= 0) {
          try {
            chapterDetail = await mangaService.getChapter(manga.id, chapter.index);
          } catch (e) {
            console.warn(`[DownloadStore] Failed to resolve pageCount for chapter ${chapter.index}:`, e);
          }
        }

        const pageCount = chapterDetail.pageCount;
        if (!pageCount || pageCount <= 0) {
          throw new Error(`Chapter ${chapterDetail.name} has no pages (${pageCount}).`);
        }

        this.chapterProgress[chapter.id] = {
          loaded: 0,
          total: pageCount,
          percent: 0,
        };

        const pageUrls = Array.from({ length: pageCount }, (_, pageIdx) =>
          mangaService.getPageImageUrl(manga.id, chapterDetail.index, pageIdx, false)
        );

        const result = await pool.dispatch(
          'chapterDownload',
          {
            mangaId: manga.id,
            chapterId: chapterDetail.index,
            pageUrls,
          },
          (progress) => {
            const pct = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
            this.chapterProgress[chapter.id] = {
              loaded: progress.loaded,
              total: progress.total,
              percent: pct,
            };
          }
        );

        if (result.status === 'success') {
          await this.saveChapterOffline(manga.id, chapterDetail);
          if (!this.downloadedChapterIds.includes(chapterDetail.id)) {
            this.downloadedChapterIds.push(chapterDetail.id);
          }
          return true;
        } else {
          console.error(`[DownloadStore] Chapter ${chapterDetail.name} error:`, result.error);
          return false;
        }
      } catch (err) {
        console.error('[DownloadStore] downloadSingleChapter error:', err);
        return false;
      } finally {
        delete this.chapterProgress[chapter.id];
      }
    },

    /**
     * Download semua chapter menggunakan WorkerPool secara concurrent
     */
    async startDownloadAll(
      manga: MangaDataClass,
      chapters: ChapterDataClass[],
      pool: WorkerPool
    ): Promise<void> {
      if (this.isDownloading) {
        console.warn('[DownloadStore] A download task is already in progress.');
        return;
      }

      if (!chapters || chapters.length === 0) {
        console.warn('[DownloadStore] No chapters provided.');
        return;
      }

      this._abortController = new AbortController();
      this.isDownloading = true;
      this.currentMangaId = manga.id;
      this.mangaTitle = manga.title;
      this.totalChapters = chapters.length;
      this.completedChapters = 0;
      this.failedChapters = 0;
      this.currentChapterIndex = 0;
      this.currentChapterPageIndex = 0;
      this.currentChapterTotalPages = 0;
      this.totalImages = 0;
      this.downloadedImages = 0;
      this.error = null;

      try {
        await this.saveMangaOffline(manga);

        // Urutkan chapter dari nomor awal ke akhir
        const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

        // 1. Pre-resolve detail chapter untuk menghitung total gambar
        this.currentChapterName = 'Preparing download...';
        const resolvedChapters: ChapterDataClass[] = [];
        const BATCH_RESOLVE = 5;

        for (let i = 0; i < sortedChapters.length; i += BATCH_RESOLVE) {
          if (this._abortController?.signal.aborted) break;

          const batch = sortedChapters.slice(i, i + BATCH_RESOLVE);
          const batchResults = await Promise.all(
            batch.map(async (ch) => {
              if (ch.pageCount && ch.pageCount > 0) return ch;
              try {
                return await mangaService.getChapter(manga.id, ch.index);
              } catch (e) {
                console.warn(`[DownloadStore] Failed to resolve pageCount for chapter ${ch.index}:`, e);
                return ch;
              }
            })
          );

          resolvedChapters.push(...batchResults);
        }

        if (this._abortController?.signal.aborted) {
          return;
        }

        this.totalImages = resolvedChapters.reduce(
          (acc, c) => acc + (c.pageCount && c.pageCount > 0 ? c.pageCount : 0),
          0
        );

        // Inisialisasi progress untuk semua chapter agar list chapter langsung menampilkan 0%
        for (const ch of resolvedChapters) {
          this.chapterProgress[ch.id] = {
            loaded: 0,
            total: ch.pageCount || 1,
            percent: 0,
          };
        }

        // Map pelacak jumlah gambar terunduh per chapter untuk progres ringkasan global
        const imagesProgressByChapter: Record<number, number> = {};

        // 2. Dispatch semua chapter ke WorkerPool
        // WorkerPool akan memproses secara concurrent sesuai kapasitas worker yang tersedia
        const downloadPromises = resolvedChapters.map(async (chapterDetail, index) => {
          const pageCount = chapterDetail.pageCount;
          if (!pageCount || pageCount <= 0) {
            console.warn(`[DownloadStore] Chapter ${chapterDetail.name} has no pages (${pageCount}). Skipping.`);
            this.failedChapters++;
            delete this.chapterProgress[chapterDetail.id];
            return;
          }

          const pageUrls = Array.from({ length: pageCount }, (_, pageIdx) =>
            mangaService.getPageImageUrl(manga.id, chapterDetail.index, pageIdx, false)
          );

          try {
            const result = await pool.dispatch(
              'chapterDownload',
              {
                mangaId: manga.id,
                chapterId: chapterDetail.index,
                pageUrls,
              },
              (progress) => {
                if (this._abortController?.signal.aborted) return;

                const pct = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
                this.chapterProgress[chapterDetail.id] = {
                  loaded: progress.loaded,
                  total: progress.total,
                  percent: pct,
                };

                imagesProgressByChapter[chapterDetail.id] = progress.loaded;
                this.downloadedImages = Object.values(imagesProgressByChapter).reduce((a, b) => a + b, 0);

                this.currentChapterName = chapterDetail.name || `Chapter ${chapterDetail.chapterNumber}`;
                this.currentChapterIndex = index + 1;
                this.currentChapterPageIndex = progress.loaded;
                this.currentChapterTotalPages = progress.total;
              }
            );

            if (this._abortController?.signal.aborted) {
              delete this.chapterProgress[chapterDetail.id];
              return;
            }

            if (result.status === 'success') {
              imagesProgressByChapter[chapterDetail.id] = pageCount;
              this.downloadedImages = Object.values(imagesProgressByChapter).reduce((a, b) => a + b, 0);

              await this.saveChapterOffline(manga.id, chapterDetail);

              if (!this.downloadedChapterIds.includes(chapterDetail.id)) {
                this.downloadedChapterIds.push(chapterDetail.id);
              }
              this.completedChapters++;
            } else {
              console.error(`[DownloadStore] Chapter ${chapterDetail.name} error:`, result.error);
              this.failedChapters++;
            }
          } catch (err: any) {
            console.error(`[DownloadStore] Failed dispatching chapter ${chapterDetail.name}:`, err);
            this.failedChapters++;
          } finally {
            delete this.chapterProgress[chapterDetail.id];
          }
        });

        await Promise.allSettled(downloadPromises);
      } catch (err: any) {
        this.error = err?.message || 'Download process failed';
        console.error('[DownloadStore] Error during download process:', err);
      } finally {
        this.isDownloading = false;
        this._abortController = null;
        this.currentChapterName = '';
        this.chapterProgress = {};
      }
    },

    /**
     * Batalkan proses download yang sedang berjalan
     */
    cancelDownload(pool?: WorkerPool): void {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      if (pool) {
        pool.clearQueue();
      }
      this.isDownloading = false;
      this.currentChapterName = '';
      this.chapterProgress = {};
    },
  },
});
