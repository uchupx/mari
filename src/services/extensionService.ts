import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type { ExtensionDataClass } from '@/types/api';

export class ExtensionService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 6. Ambil daftar extension
   * GET /api/v1/extension/list
   */
  public async getExtensions(): Promise<ExtensionDataClass[]> {
    return this.client.get<ExtensionDataClass[]>('/extension/list');
  }

  /**
   * 6. Install extension dari repo
   * GET /api/v1/extension/install/{pkgName}
   */
  public async installExtension(pkgName: string): Promise<void> {
    return this.client.get<void>(`/extension/install/${pkgName}`);
  }

  /**
   * 6. Install extension manual via file .apk
   * POST /api/v1/extension/install
   */
  public async installExtensionFile(file: File | Blob): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post<void>('/extension/install', formData, { isMultipart: true });
  }

  /**
   * 6. Update extension
   * GET /api/v1/extension/update/{pkgName}
   */
  public async updateExtension(pkgName: string): Promise<void> {
    return this.client.get<void>(`/extension/update/${pkgName}`);
  }

  /**
   * 6. Uninstall extension
   * GET /api/v1/extension/uninstall/{pkgName}
   */
  public async uninstallExtension(pkgName: string): Promise<void> {
    return this.client.get<void>(`/extension/uninstall/${pkgName}`);
  }

  /**
   * 6. Ambil icon APK extension
   * GET /api/v1/extension/icon/{pkgName}
   */
  public getIconUrl(pkgName: string): string {
    return `${this.client.getBaseUrl()}/extension/icon/${pkgName}`;
  }

  /**
   * 6. Fetch icon blob
   */
  public async getIconBlob(pkgName: string): Promise<Blob> {
    return this.client.getBlob(`/extension/icon/${pkgName}`);
  }
}

export const extensionService = new ExtensionService();
