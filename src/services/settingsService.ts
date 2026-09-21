import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type { ServerAbout, ServerUpdateCheck } from '@/types/api';

export class SettingsService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 11. Ambil meta key-value server
   * GET /api/v1/meta
   */
  public async getMeta(): Promise<Record<string, string>> {
    return this.client.get<Record<string, string>>('/meta');
  }

  /**
   * 11. Update meta key-value server
   * PATCH /api/v1/meta
   */
  public async updateMeta(key: string, value: string): Promise<void> {
    return this.client.patch<void>('/meta', { key, value }, { isUrlEncoded: true });
  }

  /**
   * 11. Info server (versi, revision, build type)
   * GET /api/v1/settings/about
   */
  public async getAbout(): Promise<ServerAbout> {
    return this.client.get<ServerAbout>('/settings/about');
  }

  /**
   * 11. Cek update Suwayomi server terbaru
   * GET /api/v1/settings/check-update
   */
  public async checkUpdate(): Promise<ServerUpdateCheck[]> {
    return this.client.get<ServerUpdateCheck[]>('/settings/check-update');
  }
}

export const settingsService = new SettingsService();
