import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, share, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { apiRootUrl } from '../http/api-url';
import { AuthService } from '../services/auth.service';
import { AdminAuthService } from '../services/admin-auth.service';

const apiPrefix = apiRootUrl();
const refreshUrlSegment = '/auth/refresh-token';

function isAdminApiRequest(url: string): boolean {
  return url.includes('/api/admin/');
}

function bearerTokenForRequest(
  auth: AuthService,
  adminAuth: AdminAuthService,
  url: string,
): string | null {
  if (isAdminApiRequest(url)) {
    return adminAuth.getAccessToken() ?? auth.getAccessToken();
  }
  return auth.getAccessToken();
}

// Shared across concurrent 401s so a burst of failing requests triggers
// a single refresh call instead of one per request.
let refreshInProgress$: Observable<string> | null = null;

function refreshAccessToken$(auth: AuthService): Observable<string> {
  if (!refreshInProgress$) {
    refreshInProgress$ = auth.refreshAccessToken().pipe(
      finalize(() => (refreshInProgress$ = null)),
      share(),
    );
  }
  return refreshInProgress$;
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);
  const onAdminArea = router.url.startsWith('/admin');
  const token = onAdminArea
    ? bearerTokenForRequest(auth, adminAuth, req.url)
    : auth.getAccessToken();
  const isApiRequest = req.url.startsWith(apiPrefix);
  const isRefreshRequest = req.url.includes(refreshUrlSegment);
  const useAdminSession = onAdminArea && isAdminApiRequest(req.url) && !!adminAuth.peekRefreshToken();

  let outgoing = req;
  if (isApiRequest && token) {
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      // The refresh call itself failed (expired/invalid refresh token) —
      // do not attempt another refresh or we loop forever.
      if (err.status !== 401 || isRefreshRequest || !isApiRequest) return throwError(() => err);

      const refresh$ = useAdminSession
        ? adminAuth.refreshAccessToken()
        : refreshAccessToken$(auth);

      return refresh$.pipe(
        switchMap((newToken) => {
          if (!newToken) return throwError(() => err);
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            })
          );
        }),
        catchError(() => throwError(() => err))
      );
    })
  );
};
