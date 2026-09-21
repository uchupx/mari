import { SuwayomiApiError, type JavalinErrorResponse } from '@/types/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  isUrlEncoded?: boolean;
  isMultipart?: boolean;
  responseType?: 'json' | 'blob' | 'text' | 'void';
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api/v1', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = defaultHeaders;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setAuthHeader(tokenOrBasicAuth: string, isBasic: boolean = false): void {
    if (isBasic) {
      this.defaultHeaders['Authorization'] = `Basic ${tokenOrBasicAuth}`;
    } else {
      this.defaultHeaders['Authorization'] = `Bearer ${tokenOrBasicAuth}`;
    }
  }

  public clearAuthHeader(): void {
    delete this.defaultHeaders['Authorization'];
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  public async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      params,
      body,
      isUrlEncoded,
      isMultipart,
      responseType = 'json',
      headers = {},
      ...customConfig
    } = options;

    const url = this.buildUrl(path, params);
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...(headers as Record<string, string>),
    };

    let processedBody: BodyInit | null | undefined = undefined;

    if (body !== undefined && body !== null) {
      if (isMultipart) {
        // Browser will set boundary automatically when Content-Type is omitted
        delete requestHeaders['Content-Type'];
        processedBody = body as FormData;
      } else if (isUrlEncoded) {
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        if (body instanceof URLSearchParams) {
          processedBody = body.toString();
        } else if (typeof body === 'object') {
          const params = new URLSearchParams();
          Object.entries(body).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
              params.append(k, String(v));
            }
          });
          processedBody = params.toString();
        } else {
          processedBody = String(body);
        }
      } else if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
        processedBody = body;
      } else {
        requestHeaders['Content-Type'] = 'application/json';
        processedBody = JSON.stringify(body);
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers: requestHeaders,
      body: processedBody,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (networkError: any) {
      throw new SuwayomiApiError(0, `Network Connection Failed: ${networkError.message}`);
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorDetails: Record<string, unknown> | undefined;
      let errorType: string | undefined;

      const contentType = response.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          const jsonError = (await response.json()) as JavalinErrorResponse;
          errorMessage = jsonError.title || errorMessage;
          errorDetails = jsonError.details;
          errorType = jsonError.type;
        } else {
          const textError = await response.text();
          if (textError && textError.trim().length > 0) {
            errorMessage = textError.trim();
          }
        }
      } catch {
        // Fallback to generic status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new SuwayomiApiError(response.status, errorMessage, errorDetails, errorType);
    }

    if (responseType === 'void' || response.status === 204) {
      return undefined as T;
    }

    if (responseType === 'blob') {
      return (await response.blob()) as unknown as T;
    }

    if (responseType === 'text') {
      return (await response.text()) as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  public get<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined | null>, options: Omit<RequestOptions, 'params' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET', params });
  }

  public post<T = unknown>(path: string, body?: any, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  public put<T = unknown>(path: string, body?: any, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  public patch<T = unknown>(path: string, body?: any, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  public delete<T = unknown>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  public getBlob(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<Blob> {
    return this.get<Blob>(path, params, { responseType: 'blob' });
  }
}

export const defaultApiClient = new ApiClient(
  `${(import.meta.env.SUWAYOMI_SERVER_URL ?? '').replace(/\/+$/, '')}/api/v1`
);
