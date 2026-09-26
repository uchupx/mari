import type { ChapterDownloadPayload, ChapterDownloadResult } from "./types";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export async function pageDownloadWorker(payload: ChapterDownloadPayload): Promise<ChapterDownloadResult> {
  const { mangaId, chapterId, pageUrls } = payload;

  try {
    const pageResults: Record<number, string> = {};

    for (let i = 0; i < pageUrls.length; i++) {
      const pageResponse = await fetch(pageUrls[i]);
      if (!pageResponse.ok) {
        throw new Error(`HTTP ${pageResponse.status} on page ${i}`);
      }
      const blob = await pageResponse.blob();
      pageResults[i] = await blobToDataUrl(blob);
    }

    return {
      status: 'success',
      data: pageResults,
      mangaId,
      chapterId,
    };

  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      data: undefined,
      mangaId,
      chapterId,
    };
  }
}
