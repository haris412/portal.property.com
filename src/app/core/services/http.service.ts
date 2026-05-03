import { HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { BaseResponse } from '../models/base-response.model';

// Generic HTTP wrapper used by all feature services instead of injecting HttpClient directly.
// Every method catches errors internally and returns BaseResponse<T> — it never throws.
// This means consuming services don't need their own catchError boilerplate.
@Injectable({ providedIn: 'root' })
export class HttpService {
  private readonly http = inject(HttpClient);

  // Default headers for JSON requests.
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
    }),
  };

  // FormData requests must NOT set Content-Type — the browser sets it automatically
  // with the correct multipart boundary. Setting it manually breaks file uploads.
  private readonly httpOptionsFormData = {
    headers: new HttpHeaders({
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
    }),
  };

  get<T>(url: string): Observable<BaseResponse<T>> {
    return this.http.get<T>(url, this.httpOptions).pipe(
      map((response) => BaseResponse.success<T>(response)),
      catchError((error) => of(this.handleError<T>(error as HttpErrorResponse))),
    );
  }

  post<T>(url: string, body?: unknown): Observable<BaseResponse<T>> {
    const options = body instanceof FormData ? this.httpOptionsFormData : this.httpOptions;
    return this.http.post<T>(url, body, options).pipe(
      map((response) => BaseResponse.success<T>(response)),
      catchError((error) => of(this.handleError<T>(error as HttpErrorResponse))),
    );
  }

  put<T>(url: string, body?: unknown): Observable<BaseResponse<T>> {
    const options = body instanceof FormData ? this.httpOptionsFormData : this.httpOptions;
    return this.http.put<T>(url, body, options).pipe(
      map((response) => BaseResponse.success<T>(response)),
      catchError((error) => of(this.handleError<T>(error as HttpErrorResponse))),
    );
  }

  patch<T>(url: string, body?: unknown): Observable<BaseResponse<T>> {
    const options = body instanceof FormData ? this.httpOptionsFormData : this.httpOptions;
    return this.http.patch<T>(url, body, options).pipe(
      map((response) => BaseResponse.success<T>(response)),
      catchError((error) => of(this.handleError<T>(error as HttpErrorResponse))),
    );
  }

  delete<T>(url: string): Observable<BaseResponse<T>> {
    return this.http.delete<T>(url, this.httpOptions).pipe(
      map((response) => BaseResponse.success<T>(response)),
      catchError((error) => of(this.handleError<T>(error as HttpErrorResponse))),
    );
  }

  // Converts an HttpErrorResponse into a BaseResponse so the observable never errors out.
  private handleError<T>(error: HttpErrorResponse): BaseResponse<T> {
    // 401: auth interceptor handles the redirect/refresh — return empty success so
    // nothing breaks in the component while the interceptor retries or redirects.
    if (error.status === HttpStatusCode.Unauthorized) {
      return BaseResponse.success<T>({} as T);
    }

    // 403: API may return partial result data (e.g. subscription limit info),
    // so we use errorWithResult to preserve it alongside the error message.
    if (error.status === HttpStatusCode.Forbidden) {
      return BaseResponse.errorWithResult<T>(
        error.error?.result,
        this.extractMessage(error),
        error.status,
      );
    }

    return BaseResponse.error<T>(this.extractMessage(error), error.status);
  }

  // Reads the human-readable message from the error response body.
  // For known client errors (4xx) the backend provides a specific message.
  // For server errors (5xx) or unknown cases we fall back to a generic string.
  private extractMessage(error: HttpErrorResponse): string {
    const clientErrorStatuses = [
      HttpStatusCode.BadRequest,
      HttpStatusCode.NotFound,
      HttpStatusCode.Conflict,
      HttpStatusCode.UnprocessableEntity,
    ];

    if (clientErrorStatuses.includes(error.status) && error.error?.message) {
      return error.error.message;
    }

    // 403 Forbidden: check for a subscription-limit error first, then fall back
    // to the generic message field, then a hardcoded string.
    if (error.status === HttpStatusCode.Forbidden) {
      const subscriptionError = error.error?.Errors?.SubscriptionLimitExceeded?.[0];
      return subscriptionError ?? error.error?.message ?? 'Access denied.';
    }

    return 'Something went wrong. Please try again.';
  }
}
