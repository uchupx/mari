import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type {
  TrackerItem,
  TrackerLoginRequest,
  TrackSearchDataClass,
  TrackUpdateRequest,
} from '@/types/api';

export class TrackerService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 9. Ambil list tracker (MAL, AniList, Kitsu, dll)
   * GET /api/v1/track/list
   */
  public async getTrackers(): Promise<TrackerItem[]> {
    return this.client.get<TrackerItem[]>('/track/list');
  }

  /**
   * 9. Login ke tracker
   * POST /api/v1/track/login
   */
  public async login(payload: TrackerLoginRequest): Promise<void> {
    return this.client.post<void>('/track/login', payload);
  }

  /**
   * 9. Logout dari tracker
   * POST /api/v1/track/logout
   */
  public async logout(trackerId: number): Promise<void> {
    return this.client.post<void>('/track/logout', { trackerId });
  }

  /**
   * 9. Cari judul manga di tracker
   * POST /api/v1/track/search
   */
  public async search(trackerId: number, title: string): Promise<TrackSearchDataClass[]> {
    return this.client.post<TrackSearchDataClass[]>('/track/search', { trackerId, title });
  }

  /**
   * 9. Hubungkan manga lokal dengan item tracker remote
   * POST /api/v1/track/bind?mangaId=1&trackerId=1&remoteId=12345&private=false
   */
  public async bind(mangaId: number, trackerId: number, remoteId: number, isPrivate: boolean = false): Promise<void> {
    return this.client.post<void>('/track/bind', undefined, {
      params: {
        mangaId,
        trackerId,
        remoteId,
        private: isPrivate,
      },
    });
  }

  /**
   * 9. Update progress / status tracking remote
   * POST /api/v1/track/update
   */
  public async updateTrack(payload: TrackUpdateRequest): Promise<void> {
    return this.client.post<void>('/track/update', payload);
  }
}

export const trackerService = new TrackerService();
