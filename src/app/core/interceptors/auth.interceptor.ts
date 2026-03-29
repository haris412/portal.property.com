import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const authPrefix = `${environment.apiUrl}/api/auth`;
const apiPrefix = `${environment.apiUrl}/api`;

function isAuthUrl(url: string): boolean {
  return url.startsWith(authPrefix);
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  const isApiRequest = req.url.startsWith(apiPrefix);

  let outgoing = req;
  // Do not attach bearer token to external URLs (e.g. S3 signed upload URLs).
  if (isApiRequest && !isAuthUrl(req.url) && token) {
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      if (isAuthUrl(req.url) && req.url.includes('refresh-token')) {
        auth.logout();
        return throwError(() => err);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((newToken) => {
          if (!newToken) return throwError(() => err);
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          }));
        }),
        catchError(() => throwError(() => err))
      );
    })
  );
};
