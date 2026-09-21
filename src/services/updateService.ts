import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type { RecentChaptersResponse, UpdateSummary } from '@/types/api';

export class UpdateService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 8. Ambil chapter baru saja diupdate
   * GET /api/v1/update/recentChapters/{pageNum}
   */
  public async getRecentChapters(pageNum: number = 1): Promise<RecentChaptersResponse> {
    return this.client.get<RecentChaptersResponse>(`/update/recentChapters/${pageNum}`);
  }

  /**
   * 8. Trigger pengecekan update manga library
   * POST /api/v1/update/fetch
   */
  public async fetchUpdates(categoryId?: number): Promise<void> {
    const body: Record<string, any> = {};
    if (categoryId !== undefined) {
      body.categoryId = categoryId;
    }
    return this.client.post<void>('/update/fetch', body, { isUrlEncoded: true });
  }

  /**
   * 8. Reset proses update
   * POST /api/v1/update/reset
   */
  public async resetUpdates(): Promise<void> {
    return this.client.post<void>('/update/reset');
  }

  /**
   * 8. Ambil ringkasan status update
   * GET /api/v1/update/summary
   */
  public async getSummary(): Promise<UpdateSummary> {
    return this.client.get<UpdateSummary>('/update/summary');
  }
}

export const updateService = new UpdateService();
