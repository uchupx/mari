import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type {
  BatchChapterRequest,
  CategoryDataClass,
  ChapterDataClass,
  CrossMangaBatchChapterRequest,
  MangaDataClass,
  UpdateChapterPayload,
} from '@/types/api';

export class MangaService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 4.1. Ambil detail manga
   * GET /api/v1/manga/{mangaId}?onlineFetch=true|false
   */
  public async getManga(mangaId: number, onlineFetch: boolean = false): Promise<MangaDataClass> {
    return this.client.get<MangaDataClass>(`/manga/${mangaId}`, { onlineFetch });
  }

  /**
   * 4.1. Ambil detail manga lengkap dengan chapters dan trackers
   * GET /api/v1/manga/{mangaId}/full?onlineFetch=true|false
   */
  public async getMangaFull(mangaId: number, onlineFetch: boolean = false): Promise<MangaDataClass> {
    return this.client.get<MangaDataClass>(`/manga/${mangaId}/full`, { onlineFetch });
  }

  /**
   * 4.1. URL thumbnail manga
   */
  public getThumbnailUrl(mangaId: number): string {
    return `${this.client.getBaseUrl()}/manga/${mangaId}/thumbnail`;
  }

  /**
   * 4.1. Fetch Binary Image Blob Thumbnail
   * GET /api/v1/manga/{mangaId}/thumbnail
   */
  public async getThumbnailBlob(mangaId: number): Promise<Blob> {
    return this.client.getBlob(`/manga/${mangaId}/thumbnail`);
  }

  /**
   * 4.1. Update Manga Metadata
   * PATCH /api/v1/manga/{mangaId}/meta
   */
  public async updateMangaMeta(mangaId: number, key: string, value: string): Promise<void> {
    return this.client.patch<void>(
      `/manga/${mangaId}/meta`,
      { key, value },
      { isUrlEncoded: true }
    );
  }

  /**
   * 4.2. Tambah manga ke Library
   * GET /api/v1/manga/{mangaId}/library
   */
  public async addToLibrary(mangaId: number): Promise<void> {
    return this.client.get<void>(`/manga/${mangaId}/library`);
  }

  /**
   * 4.2. Hapus manga dari Library
   * DELETE /api/v1/manga/{mangaId}/library
   */
  public async removeFromLibrary(mangaId: number): Promise<void> {
    return this.client.delete<void>(`/manga/${mangaId}/library`);
  }

  /**
   * 4.2. Ambil kategori tempat manga berada
   * GET /api/v1/manga/{mangaId}/category
   */
  public async getMangaCategories(mangaId: number): Promise<CategoryDataClass[]> {
    return this.client.get<CategoryDataClass[]>(`/manga/${mangaId}/category`);
  }

  /**
   * 4.2. Masukkan manga ke kategori
   * GET /api/v1/manga/{mangaId}/category/{categoryId}
   */
  public async addMangaToCategory(mangaId: number, categoryId: number): Promise<void> {
    return this.client.get<void>(`/manga/${mangaId}/category/${categoryId}`);
  }

  /**
   * 4.2. Hapus manga dari kategori
   * DELETE /api/v1/manga/{mangaId}/category/{categoryId}
   */
  public async removeMangaFromCategory(mangaId: number, categoryId: number): Promise<void> {
    return this.client.delete<void>(`/manga/${mangaId}/category/${categoryId}`);
  }

  /**
   * 4.3. Ambil daftar chapter manga
   * GET /api/v1/manga/{mangaId}/chapters?onlineFetch=false
   */
  public async getChapters(mangaId: number, onlineFetch: boolean = false): Promise<ChapterDataClass[]> {
    return this.client.get<ChapterDataClass[]>(`/manga/${mangaId}/chapters`, { onlineFetch });
  }

  /**
   * 4.3. Ambil single chapter
   * GET /api/v1/manga/{mangaId}/chapter/{chapterIndex}
   */
  public async getChapter(mangaId: number, chapterIndex: number): Promise<ChapterDataClass> {
    return this.client.get<ChapterDataClass>(`/manga/${mangaId}/chapter/${chapterIndex}`);
  }

  /**
   * 4.3. Update status baca/bookmark chapter
   * PATCH / PUT /api/v1/manga/{mangaId}/chapter/{chapterIndex}
   */
  public async updateChapter(
    mangaId: number,
    chapterIndex: number,
    payload: UpdateChapterPayload
  ): Promise<void> {
    return this.client.patch<void>(
      `/manga/${mangaId}/chapter/${chapterIndex}`,
      payload,
      { isUrlEncoded: true }
    );
  }

  /**
   * 4.3. Hapus unduhan chapter
   * DELETE /api/v1/manga/{mangaId}/chapter/{chapterIndex}
   */
  public async deleteDownloadedChapter(mangaId: number, chapterIndex: number): Promise<void> {
    return this.client.delete<void>(`/manga/${mangaId}/chapter/${chapterIndex}`);
  }

  /**
   * 4.3. URL Page Image
   */
  public getPageImageUrl(mangaId: number, chapterIndex: number, pageIndex: number, updateProgress: boolean = true): string {
    return `${this.client.getBaseUrl()}/manga/${mangaId}/chapter/${chapterIndex}/page/${pageIndex}?updateProgress=${updateProgress}`;
  }

  /**
   * 4.3. Download page image binary
   * GET /api/v1/manga/{mangaId}/chapter/{chapterIndex}/page/{index}?updateProgress=true
   */
  public async getPageImage(
    mangaId: number,
    chapterIndex: number,
    pageIndex: number,
    updateProgress: boolean = true
  ): Promise<Blob> {
    return this.client.getBlob(`/manga/${mangaId}/chapter/${chapterIndex}/page/${pageIndex}`, {
      updateProgress,
    });
  }

  /**
   * 4.4. Operasi Batch Chapter untuk Satu Manga
   * POST /api/v1/manga/{mangaId}/chapter/batch
   */
  public async batchChapterOperation(mangaId: number, request: BatchChapterRequest): Promise<void> {
    return this.client.post<void>(`/manga/${mangaId}/chapter/batch`, request);
  }

  /**
   * 4.4. Operasi Batch Chapter Lintas Manga
   * POST /api/v1/chapter/batch
   */
  public async crossMangaBatchChapterOperation(request: CrossMangaBatchChapterRequest): Promise<void> {
    return this.client.post<void>('/chapter/batch', request);
  }

  /**
   * 4.5. Download Chapter File (CBZ)
   * GET /api/v1/chapter/{chapterId}/download?markAsRead=false
   */
  public async downloadCbz(chapterId: number, markAsRead: boolean = false): Promise<Blob> {
    return this.client.getBlob(`/chapter/${chapterId}/download`, { markAsRead });
  }
}

export const mangaService = new MangaService();
