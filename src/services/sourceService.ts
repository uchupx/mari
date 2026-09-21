import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type {
  FilterChange,
  FilterData,
  FilterItem,
  MangaSearchResult,
  SourceDataClass,
} from '@/types/api';

export class SourceService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 3.1. Ambil Struktur Filter Source
   * GET /api/v1/source/{sourceId}/filters?reset=false
   */
  public async getFilters(sourceId: string | number, reset: boolean = false): Promise<FilterItem[]> {
    return this.client.get<FilterItem[]>(`/source/${sourceId}/filters`, { reset });
  }

  /**
   * 3.2. Set / Update Filter Source
   * POST /api/v1/source/{sourceId}/filters
   */
  public async setFilters(sourceId: string | number, filters: FilterChange[] | FilterChange): Promise<void> {
    return this.client.post<void>(`/source/${sourceId}/filters`, filters);
  }

  /**
   * 3.3. Search Manga dengan Filter Tersimpan
   * GET /api/v1/source/{sourceId}/search?searchTerm={term}&pageNum={pageNum}
   */
  public async search(sourceId: string | number, searchTerm: string = '', pageNum: number = 1): Promise<MangaSearchResult> {
    return this.client.get<MangaSearchResult>(`/source/${sourceId}/search`, {
      searchTerm,
      pageNum,
    });
  }

  /**
   * 3.4. Quick Search (Stateless Search + Filter Sekaligus)
   * POST /api/v1/source/{sourceId}/quick-search?pageNum={pageNum}
   */
  public async quickSearch(sourceId: string | number, data: FilterData, pageNum: number = 1): Promise<MangaSearchResult> {
    return this.client.post<MangaSearchResult>(`/source/${sourceId}/quick-search`, data, {
      params: { pageNum },
    });
  }

  /**
   * 3.5. Source List
   * GET /api/v1/source/list
   */
  public async getSources(): Promise<SourceDataClass[]> {
    return this.client.get<SourceDataClass[]>('/source/list');
  }

  /**
   * 3.5. Source Detail
   * GET /api/v1/source/{sourceId}
   */
  public async getSource(sourceId: string | number): Promise<SourceDataClass> {
    return this.client.get<SourceDataClass>(`/source/${sourceId}`);
  }

  /**
   * 3.5. Source Popular Manga
   * GET /api/v1/source/{sourceId}/popular/{pageNum}
   */
  public async getPopular(sourceId: string | number, pageNum: number = 1): Promise<MangaSearchResult> {
    return this.client.get<MangaSearchResult>(`/source/${sourceId}/popular/${pageNum}`);
  }

  /**
   * 3.5. Source Latest Manga
   * GET /api/v1/source/{sourceId}/latest/{pageNum}
   */
  public async getLatest(sourceId: string | number, pageNum: number = 1): Promise<MangaSearchResult> {
    return this.client.get<MangaSearchResult>(`/source/${sourceId}/latest/${pageNum}`);
  }
}

export const sourceService = new SourceService();
