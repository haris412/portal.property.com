import {
  HttpContextToken,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { LoadingService } from '../http/loading.service';

export const SkipLoading = new HttpContextToken<boolean>(() => false);

export function loadingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const loadingService = inject<LoadingService>(LoadingService);

  // Check for a custom attribute
  // to avoid showing loading spinner
  if (req.context.get(SkipLoading)) {
    // Pass the request directly to the next handler
    return next(req);
  }

  // Turn on the loading spinner
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Turn off the loading spinner
      loadingService.hide();
    })
  );
}
