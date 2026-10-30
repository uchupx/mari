import { defineStore } from 'pinia';
import { dbService } from '@/db/indexdb';
import { defaultApiClient } from '@/services/apiClient';
import { mangaService } from '@/services';
import type { ChapterDataClass, MangaDataClass } from '@/types/api';
import type { WorkerPool } from '@/workers/pool';

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
     * Download semua chapter menggunakan WorkerPool dengan counting per image
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
        // 1. Simpan metadata Manga ke IndexedDB (plain object)
        const plainManga = JSON.parse(JSON.stringify(manga));
        await dbService.saveManga({
          ...plainManga,
          savedAt: Date.now(),
          hasUpdate: false,
        });

        // Simpan metadata manga ke Cache Storage (api-cache) jika didukung
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

        // Urutkan chapter dari nomor awal ke akhir
        const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

        // 2. Pre-resolve detail chapter untuk menghitung total gambar
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
          this.totalImages = resolvedChapters.reduce(
            (acc, c) => acc + (c.pageCount && c.pageCount > 0 ? c.pageCount : 0),
            0
          );
        }

        if (this._abortController?.signal.aborted) {
          return;
        }

        let completedImagesBase = 0;

        // 3. Loop dan unduh tiap chapter via worker pool dengan counting image detail
        for (let i = 0; i < resolvedChapters.length; i++) {
          if (this._abortController?.signal.aborted) {
            console.log('[DownloadStore] Download cancelled by user.');
            break;
          }

          const chapterDetail = resolvedChapters[i];
          this.currentChapterIndex = i + 1;
          this.currentChapterName = chapterDetail.name || `Chapter ${chapterDetail.chapterNumber}`;
          this.currentChapterTotalPages = chapterDetail.pageCount || 0;
          this.currentChapterPageIndex = 0;

          const pageCount = chapterDetail.pageCount;
          if (!pageCount || pageCount <= 0) {
            console.warn(`[DownloadStore] Chapter ${chapterDetail.name} has no pages (${pageCount}). Skipping.`);
            this.failedChapters++;
            continue;
          }

          // Generate URLs halaman chapter
          const pageUrls = Array.from({ length: pageCount }, (_, pageIdx) =>
            mangaService.getPageImageUrl(manga.id, chapterDetail.index, pageIdx, false)
          );

          const currentBase = completedImagesBase;

          try {
            const result = await pool.dispatch(
              'chapterDownload',
              {
                mangaId: manga.id,
                chapterId: chapterDetail.index,
                pageUrls,
              },
              (progress) => {
                this.currentChapterPageIndex = progress.loaded;
                this.downloadedImages = currentBase + progress.loaded;
              }
            );

            if (result.status === 'success') {
              completedImagesBase += pageUrls.length;
              this.downloadedImages = completedImagesBase;
              this.currentChapterPageIndex = pageCount;

              const plainChapter = JSON.parse(JSON.stringify(chapterDetail));
              // Simpan chapter ke IndexedDB dengan flag isOfflineAvailable
              await dbService.saveChapters([
                {
                  ...plainChapter,
                  savedAt: Date.now(),
                  isOfflineAvailable: true,
                },
              ]);

              // Simpan JSON chapter ke api-cache untuk offline reader
              if (typeof caches !== 'undefined') {
                try {
                  const apiCache = await caches.open('api-cache');
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  const chapterApiUrl = new URL(
                    `${defaultApiClient.getBaseUrl()}/manga/${manga.id}/chapter/${chapterDetail.index}`,
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
          }
        }
      } catch (err: any) {
        this.error = err?.message || 'Download process failed';
        console.error('[DownloadStore] Error during download process:', err);
      } finally {
        this.isDownloading = false;
        this._abortController = null;
        this.currentChapterName = '';
      }
    },

    /**
     * Batalkan proses download yang sedang berjalan
     */
    cancelDownload(): void {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      this.isDownloading = false;
      this.currentChapterName = '';
    },
  },
});
