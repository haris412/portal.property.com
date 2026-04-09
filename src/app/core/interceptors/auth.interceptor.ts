import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdminAuthService } from '../services/admin-auth.service';
import { environment } from '../../../environments/environment';

const authPrefix = `${environment.apiUrl}/api/auth`;
const apiPrefix = `${environment.apiUrl}/api`;
const adminApiPrefix = `${environment.apiUrl}/api/admin`;

function isAuthUrl(url: string): boolean {
  return url.startsWith(authPrefix);
}

/**
 * Use admin JWT for admin API calls and while on admin app routes.
 * Resolvers can run before `Router.url` updates on navigation, so we must not rely on `router.url` alone for `/api/admin/*`.
 */
function shouldUseAdminBearer(routerUrl: string, requestUrl: string): boolean {
  if (requestUrl.startsWith(adminApiPrefix)) {
    return true;
  }
  return (
    routerUrl.startsWith('/admin/') &&
    !routerUrl.startsWith('/admin/auth') &&
    !routerUrl.startsWith('/admin/access-denied')
  );
}

function bearerTokenForRequest(
  routerUrl: string,
  requestUrl: string,
  auth: AuthService,
  adminAuth: AdminAuthService
): string | null {
  if (shouldUseAdminBearer(routerUrl, requestUrl)) {
    return adminAuth.getAccessToken() ?? null;
  }
  return auth.getAccessToken() ?? null;
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);
  const routerUrl = router.url;
  const token = bearerTokenForRequest(routerUrl, req.url, auth, adminAuth);
  const isApiRequest = req.url.startsWith(apiPrefix);

  let outgoing = req;
  if (isApiRequest && !isAuthUrl(req.url) && token) {
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      if (isAuthUrl(req.url) && req.url.includes('refresh-token')) {
        const body = req.body as { refreshToken?: string } | null | undefined;
        const rt = body?.refreshToken ?? '';
        if (rt && adminAuth.peekRefreshToken() === rt) {
          adminAuth.clearSessionAndRedirectToAdminLogin();
        } else {
          auth.logout();
        }
        return throwError(() => err);
      }

      const refresh$ = shouldUseAdminBearer(routerUrl, req.url)
        ? adminAuth.refreshAccessToken()
        : auth.refreshAccessToken();

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
