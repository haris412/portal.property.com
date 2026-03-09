import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const token = authService.token();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        notificationService.error('Session expired. Please log in again.');
      } else if (error.status === 403) {
        notificationService.error('You do not have permission to perform this action.');
      } else if (error.status >= 500) {
        notificationService.error('A server error occurred. Please try again later.');
      }
      return throwError(() => error);
    })
  );
};
