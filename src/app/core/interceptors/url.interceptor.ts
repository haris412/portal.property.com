import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiUrl } from '../http/api-url';

const EXTERNAL_URL_PREFIXES = [
  'resources/i18n',
  'https://',
  'http://',
] as const;

function isExternalRequest(url: string): boolean {
  return EXTERNAL_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function urlInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (isExternalRequest(req.url)) {
    return next(req);
  }

  return next(
    req.clone({
      url: resolveApiUrl(req.url),
    })
  );
}
