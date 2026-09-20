/**
 * Robust API Client with Content-Type Verification and Safe Parsing
 * Prevents "Unexpected token '<', '<!doctype '... is not valid JSON" errors.
 */

export function getApiBaseUrl(): string {
  // Support custom backend URL when frontend is deployed statically (e.g. Hostinger SPA)
  // while backend is running on Cloud Run, VPS, or separate domain.
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    ''
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtmlFallback?: boolean;
}

/**
 * Safely executes an HTTP request and verifies that the response is valid JSON
 * before attempting to parse. Never throws "Unexpected token '<'".
 */
export async function safeFetchJson<T = any>(
  pathOrUrl: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const fullUrl = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : buildApiUrl(pathOrUrl);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    const trimmedText = rawText.trim();

    // Check if the response is an HTML document (e.g. <!doctype html> or <html>)
    const isHtml =
      contentType.includes('text/html') ||
      trimmedText.startsWith('<!doctype') ||
      trimmedText.startsWith('<!DOCTYPE') ||
      trimmedText.startsWith('<html') ||
      trimmedText.startsWith('<head') ||
      trimmedText.startsWith('<body');

    let data: any = null;
    let parseError = false;

    if (!isHtml && (trimmedText.startsWith('{') || trimmedText.startsWith('['))) {
      try {
        data = JSON.parse(trimmedText);
      } catch (err) {
        parseError = true;
      }
    }

    // 1. Handle HTML fallback (e.g., Hostinger static rewrite or 404 HTML)
    if (isHtml) {
      console.warn(
        `[safeFetchJson] Expected JSON but received HTML from "${fullUrl}" (HTTP ${res.status}).`,
        `Preview: ${trimmedText.slice(0, 120)}`
      );
      return {
        ok: false,
        status: res.status,
        data: null,
        isHtmlFallback: true,
        error:
          'Unable to reach the verification service (received HTML instead of API response). Please ensure the backend API is reachable.',
      };
    }

    // 2. Handle HTTP error status (4xx, 5xx)
    if (!res.ok) {
      const serverMessage = data?.error || data?.message;
      let fallbackMessage = `Request failed with status ${res.status}.`;
      if (res.status === 404) {
        fallbackMessage = 'Verification service endpoint not found (404).';
      } else if (res.status === 429) {
        fallbackMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (res.status >= 500) {
        fallbackMessage = 'Verification server error. Please try again later.';
      }

      return {
        ok: false,
        status: res.status,
        data,
        error: serverMessage || fallbackMessage,
      };
    }

    // 3. Handle JSON parse failure
    if (parseError || data === null) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Unable to parse verification service response. Please try again.',
      };
    }

    // 4. Successful JSON response
    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (netErr: any) {
    console.error(`[safeFetchJson] Network error connecting to "${fullUrl}":`, netErr);
    return {
      ok: false,
      status: 0,
      data: null,
      error:
        netErr?.message && !netErr.message.includes('Failed to fetch')
          ? netErr.message
          : 'Unable to reach the server. Please check your internet connection and try again.',
    };
  }
}
