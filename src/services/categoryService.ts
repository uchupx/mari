import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type {
  CategoryDataClass,
  CreateCategoryPayload,
  MangaDataClass,
  ReorderCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/api';

export class CategoryService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 5. Ambil semua kategori
   * GET /api/v1/category
   */
  public async getCategories(): Promise<CategoryDataClass[]> {
    return this.client.get<CategoryDataClass[]>('/category');
  }

  /**
   * 5. Buat kategori baru
   * POST /api/v1/category
   */
  public async createCategory(payload: CreateCategoryPayload): Promise<void> {
    return this.client.post<void>('/category', payload, { isUrlEncoded: true });
  }

  /**
   * 5. Reorder kategori
   * PATCH /api/v1/category/reorder
   */
  public async reorderCategory(payload: ReorderCategoryPayload): Promise<void> {
    return this.client.patch<void>('/category/reorder', payload, { isUrlEncoded: true });
  }

  /**
   * 5. Ambil manga dalam suatu kategori
   * GET /api/v1/category/{categoryId}
   */
  public async getMangasInCategory(categoryId: number): Promise<MangaDataClass[]> {
    return this.client.get<MangaDataClass[]>(`/category/${categoryId}`);
  }

  /**
   * 5. Update detail kategori
   * PATCH /api/v1/category/{categoryId}
   */
  public async updateCategory(categoryId: number, payload: UpdateCategoryPayload): Promise<void> {
    return this.client.patch<void>(`/category/${categoryId}`, payload, { isUrlEncoded: true });
  }

  /**
   * 5. Hapus kategori
   * DELETE /api/v1/category/{categoryId}
   */
  public async deleteCategory(categoryId: number): Promise<void> {
    return this.client.delete<void>(`/category/${categoryId}`);
  }
}

export const categoryService = new CategoryService();
