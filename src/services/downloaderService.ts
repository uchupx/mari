import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type { BatchDownloadRequest } from '@/types/api';

export class DownloaderService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 7. Mulai download queue
   * GET /api/v1/downloads/start
   */
  public async startQueue(): Promise<void> {
    return this.client.get<void>('/downloads/start');
  }

  /**
   * 7. Hentikan download queue
   * GET /api/v1/downloads/stop
   */
  public async stopQueue(): Promise<void> {
    return this.client.get<void>('/downloads/stop');
  }

  /**
   * 7. Bersihkan queue
   * GET /api/v1/downloads/clear
   */
  public async clearQueue(): Promise<void> {
    return this.client.get<void>('/downloads/clear');
  }

  /**
   * 7. Antrekan 1 chapter
   * GET /api/v1/download/{mangaId}/chapter/{chapterIndex}
   */
  public async enqueueChapter(mangaId: number, chapterIndex: number): Promise<void> {
    return this.client.get<void>(`/download/${mangaId}/chapter/${chapterIndex}`);
  }

  /**
   * 7. Batalkan antrean 1 chapter
   * DELETE /api/v1/download/{mangaId}/chapter/{chapterIndex}
   */
  public async dequeueChapter(mangaId: number, chapterIndex: number): Promise<void> {
    return this.client.delete<void>(`/download/${mangaId}/chapter/${chapterIndex}`);
  }

  /**
   * 7. Antrekan batch chapter
   * POST /api/v1/download/batch
   */
  public async enqueueBatch(chapterIds: number[]): Promise<void> {
    const request: BatchDownloadRequest = { chapterIds };
    return this.client.post<void>('/download/batch', request);
  }

  /**
   * 7. Batalkan batch download
   * DELETE /api/v1/download/batch
   */
  public async dequeueBatch(chapterIds: number[]): Promise<void> {
    const request: BatchDownloadRequest = { chapterIds };
    return this.client.request<void>('/download/batch', {
      method: 'DELETE',
      body: request,
    });
  }
}

export const downloaderService = new DownloaderService();
