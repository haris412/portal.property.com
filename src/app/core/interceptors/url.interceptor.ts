import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export function urlInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  // Skip i18n requests
  if (req.url.startsWith('resources/i18n') || req.url.startsWith('https://locatehome.s3.eu-north-1.amazonaws.com') || req.url.startsWith('https://ipapi.co/json')) {
    return next(req);
  }

  const language = localStorage.getItem('appLang') || 'en';

  req = req.clone({
    url: environment.apiUrl.concat(req.url),
    // setParams: {
    //   culture: language,
    // },
  });
  return next(req);
}
