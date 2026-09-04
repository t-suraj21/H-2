import { authConfig } from '../auth/authConfig';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private tokenProvider: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Set a global token provider function (e.g. from Auth0 credentials manager)
   */
  setTokenProvider(provider: () => Promise<string | null>) {
    this.tokenProvider = provider;
  }

  /**
   * Execute an HTTP request with automatic Authorization headers
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { body, token, params, headers = {}, ...customConfig } = options;

    let url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      ...(headers as Record<string, string>),
    };

    // Obtain token explicitly or via token provider
    let authToken = token;
    if (!authToken && this.tokenProvider) {
      try {
        authToken = await this.tokenProvider();
      } catch {
        // Fallback if token retrieval fails
      }
    }

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    let formattedBody: BodyInit | null = null;
    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        formattedBody = body;
      } else {
        requestHeaders['Content-Type'] = 'application/json';
        formattedBody = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, {
        ...customConfig,
        headers: requestHeaders,
        body: formattedBody,
      });

      let json: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        json = await response.json();
      } else {
        const text = await response.text();
        json = { success: response.ok, message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          message: json?.message || `Request failed with status ${response.status}`,
          error: json?.error,
        };
      }

      return json;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network request failed. Please check your connection.',
      };
    }
  }

  get<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(authConfig.apiBaseUrl);
export default apiClient;
