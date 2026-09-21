import type { DownloadWsMessage, UpdateWsMessage } from '@/types/api';

export type MessageCallback<T> = (data: T) => void;
export type StatusCallback = (connected: boolean) => void;

export class RealtimeService {
  private downloadWs: WebSocket | null = null;
  private updateWs: WebSocket | null = null;
  private wsBaseUrl: string;

  private downloadListeners: Set<MessageCallback<DownloadWsMessage>> = new Set();
  private updateListeners: Set<MessageCallback<UpdateWsMessage>> = new Set();
  private downloadStatusListeners: Set<StatusCallback> = new Set();
  private updateStatusListeners: Set<StatusCallback> = new Set();

  constructor(wsBaseUrl?: string) {
    if (wsBaseUrl) {
      this.wsBaseUrl = wsBaseUrl.replace(/\/+$/, '');
    } else {
      const serverUrl = (import.meta.env.SUWAYOMI_SERVER_URL ?? '').replace(/\/+$/, '');
      if (serverUrl && /^https?:\/\//.test(serverUrl)) {
        this.wsBaseUrl = `${serverUrl.replace(/^http/, 'ws')}/api/v1`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.wsBaseUrl = `${protocol}//${window.location.host}/api/v1`;
      }
    }
  }

  public setWsBaseUrl(url: string): void {
    this.wsBaseUrl = url.replace(/\/+$/, '');
  }

  // ==========================================
  // 12.1. Download WebSocket
  // ==========================================

  public connectDownloads(): void {
    if (this.downloadWs && (this.downloadWs.readyState === WebSocket.OPEN || this.downloadWs.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = `${this.wsBaseUrl}/downloads`;
    try {
      this.downloadWs = new WebSocket(url);

      this.downloadWs.onopen = () => {
        this.notifyDownloadStatus(true);
      };

      this.downloadWs.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as DownloadWsMessage;
          this.downloadListeners.forEach((callback) => callback(parsed));
        } catch (e) {
          console.error('[Downloads WS] Failed to parse message:', e);
        }
      };

      this.downloadWs.onclose = () => {
        this.notifyDownloadStatus(false);
      };

      this.downloadWs.onerror = () => {
        this.notifyDownloadStatus(false);
      };
    } catch (e) {
      console.warn('[Downloads WS] Connection failed:', e);
      this.notifyDownloadStatus(false);
    }
  }

  public disconnectDownloads(): void {
    if (this.downloadWs) {
      this.downloadWs.close();
      this.downloadWs = null;
    }
  }

  public onDownloadUpdate(callback: MessageCallback<DownloadWsMessage>): () => void {
    this.downloadListeners.add(callback);
    return () => this.downloadListeners.delete(callback);
  }

  public onDownloadStatusChange(callback: StatusCallback): () => void {
    this.downloadStatusListeners.add(callback);
    return () => this.downloadStatusListeners.delete(callback);
  }

  private notifyDownloadStatus(connected: boolean): void {
    this.downloadStatusListeners.forEach((cb) => cb(connected));
  }

  // ==========================================
  // 12.2. Update WebSocket
  // ==========================================

  public connectUpdates(): void {
    if (this.updateWs && (this.updateWs.readyState === WebSocket.OPEN || this.updateWs.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = `${this.wsBaseUrl}/update`;
    try {
      this.updateWs = new WebSocket(url);

      this.updateWs.onopen = () => {
        this.notifyUpdateStatus(true);
        // Ask for current status upon connection
        this.requestUpdateStatus();
      };

      this.updateWs.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as UpdateWsMessage;
          this.updateListeners.forEach((callback) => callback(parsed));
        } catch (e) {
          console.error('[Update WS] Failed to parse message:', e);
        }
      };

      this.updateWs.onclose = () => {
        this.notifyUpdateStatus(false);
      };

      this.updateWs.onerror = () => {
        this.notifyUpdateStatus(false);
      };
    } catch (e) {
      console.warn('[Update WS] Connection failed:', e);
      this.notifyUpdateStatus(false);
    }
  }

  public requestUpdateStatus(): void {
    if (this.updateWs && this.updateWs.readyState === WebSocket.OPEN) {
      this.updateWs.send('STATUS');
    }
  }

  public disconnectUpdates(): void {
    if (this.updateWs) {
      this.updateWs.close();
      this.updateWs = null;
    }
  }

  public onUpdateMessage(callback: MessageCallback<UpdateWsMessage>): () => void {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  public onUpdateStatusChange(callback: StatusCallback): () => void {
    this.updateStatusListeners.add(callback);
    return () => this.updateStatusListeners.delete(callback);
  }

  private notifyUpdateStatus(connected: boolean): void {
    this.updateStatusListeners.forEach((cb) => cb(connected));
  }
}

export const realtimeService = new RealtimeService();
