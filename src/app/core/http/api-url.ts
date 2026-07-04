import { environment } from '../../../environments/environment';

/** REST API host/base path without the `/api` route prefix. */
export function apiBaseUrl(): string {
  return environment.apiUrl.replace(/\/+$/, '').replace(/\/api$/i, '');
}

/** REST API root including the `/api` route prefix. */
export function apiRootUrl(): string {
  return `${apiBaseUrl()}/api`;
}

/**
 * Turn a relative app path into a full API URL.
 * Inserts `/api` when the path does not already include it.
 *
 * `/auth/login` → `http://localhost:3000/api/auth/login`
 * `/api/auth/login` → `http://localhost:3000/api/auth/login` (unchanged)
 */
export function resolveApiUrl(relativePath: string): string {
  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  const apiRoot = apiRootUrl();
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  if (path === '/api' || path.startsWith('/api/')) {
    return `${apiBaseUrl()}${path}`;
  }

  return `${apiRoot}${path}`;
}
