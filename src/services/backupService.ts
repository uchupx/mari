import type { ApiClient } from './apiClient';
import { defaultApiClient } from './apiClient';
import type { BackupValidationResult } from '@/types/api';

export class BackupService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * 10. Import raw Protobuf stream
   * POST /api/v1/backup/import
   */
  public async importRaw(data: ArrayBuffer | Blob): Promise<BackupValidationResult> {
    return this.client.post<BackupValidationResult>('/backup/import', data, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }

  /**
   * 10. Import file backup (.proto.gz)
   * POST /api/v1/backup/import/file
   */
  public async importFile(file: File | Blob): Promise<BackupValidationResult> {
    const formData = new FormData();
    formData.append('backup.proto.gz', file);
    return this.client.post<BackupValidationResult>('/backup/import/file', formData, {
      isMultipart: true,
    });
  }

  /**
   * 10. Validate raw backup
   * POST /api/v1/backup/validate
   */
  public async validateRaw(data: ArrayBuffer | Blob): Promise<BackupValidationResult> {
    return this.client.post<BackupValidationResult>('/backup/validate', data, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }

  /**
   * 10. Validate file backup
   * POST /api/v1/backup/validate/file
   */
  public async validateFile(file: File | Blob): Promise<BackupValidationResult> {
    const formData = new FormData();
    formData.append('backup.proto.gz', file);
    return this.client.post<BackupValidationResult>('/backup/validate/file', formData, {
      isMultipart: true,
    });
  }

  /**
   * 10. Export backup protobuf gz stream
   * GET /api/v1/backup/export
   */
  public async exportBackup(): Promise<Blob> {
    return this.client.getBlob('/backup/export');
  }

  /**
   * 10. Export backup file
   * GET /api/v1/backup/export/file
   */
  public async exportBackupFile(): Promise<Blob> {
    return this.client.getBlob('/backup/export/file');
  }
}

export const backupService = new BackupService();
