import type { ChapterDownloadPayload, ChapterDownloadResult, WorkerProgress } from "./types";

export type PageDownloadProgressCallback = (progress: WorkerProgress) => void;

export async function pageDownloadWorker(
  payload: ChapterDownloadPayload,
  onProgress?: PageDownloadProgressCallback
): Promise<ChapterDownloadResult> {
  const { mangaId, chapterId, pageUrls } = payload;

  if (!pageUrls || pageUrls.length === 0) {
    return {
      status: 'error',
      error: 'Chapter has no pages (pageUrls is empty)',
      mangaId,
      chapterId,
    };
  }

  try {
    let cache: Cache | null = null;
    if (typeof caches !== 'undefined') {
      try {
        cache = await caches.open('manga-pages-cache');
      } catch (e) {
        console.warn('[pageDownloadWorker] CacheStorage not accessible:', e);
      }
    }

    console.log(`[pageDownloadWorker] Starting download: manga ${mangaId}, chapter ${chapterId}, ${pageUrls.length} pages`);

    let loadedCount = 0;
    const totalCount = pageUrls.length;

    // Process requests in small concurrency batches to optimize throughput
    const CONCURRENCY = 4;
    for (let i = 0; i < pageUrls.length; i += CONCURRENCY) {
      const batch = pageUrls.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (url, idx) => {
          const pageIndex = i + idx;
          const pageResponse = await fetch(url);
          if (!pageResponse.ok) {
            throw new Error(`HTTP ${pageResponse.status} on page ${pageIndex} (${url})`);
          }
          if (cache) {
            try {
              await cache.put(url, pageResponse.clone());
            } catch (err) {
              console.warn('[pageDownloadWorker] Failed to cache page:', url, err);
            }
          }
          loadedCount++;
          if (onProgress) {
            onProgress({ loaded: loadedCount, total: totalCount });
          }
        })
      );
    }

    console.log(`[pageDownloadWorker] Completed download: manga ${mangaId}, chapter ${chapterId}`);

    return {
      status: 'success',
      mangaId,
      chapterId,
    };

  } catch (error) {
    console.error(`[pageDownloadWorker] Failed chapter ${chapterId}:`, error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      data: undefined,
      mangaId,
      chapterId,
    };
  }
}
