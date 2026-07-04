import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { apiRootUrl } from '../http/api-url';
import { AuthService } from '../services/auth.service';

const apiPrefix = apiRootUrl();
function bearerTokenForRequest(
  auth: AuthService,
): string | null {
  return auth.getAccessToken() ?? null;
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = bearerTokenForRequest(auth);
  const isApiRequest = req.url.startsWith(apiPrefix);

  let outgoing = req;
  if (isApiRequest && token) {
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      const refresh$ =  auth.refreshAccessToken();
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
