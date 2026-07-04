import { environment } from '../../../environments/environment';

/** REST API host (no trailing slash), e.g. `http://localhost:3000`. */
export function apiBaseUrl(): string {
  return environment.apiUrl.replace(/\/+$/, '');
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

  const base = apiBaseUrl();
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  if (path === '/api' || path.startsWith('/api/')) {
    return `${base}${path}`;
  }

  return `${base}/api${path}`;
}
