import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ParsedHttpApiError } from './parsed-http-api-error.model';

const SERVER_ERROR_KEY = 'server' as const;

export { SERVER_ERROR_KEY };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readBody(error: unknown): { status: number; body: unknown } {
  if (error instanceof HttpErrorResponse) {
    return { status: error.status, body: error.error };
  }
  return { status: 0, body: null };
}

function collectExpressValidatorErrors(errors: unknown[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of errors) {
    if (!isRecord(item)) continue;
    const path = item['path'];
    const msg = item['msg'];
    if (typeof path === 'string' && typeof msg === 'string' && path.length) {
      out[path] = msg;
    }
  }
  return out;
}

/**
 * Maps backend JSON error responses (401/403/400 with express-validator or Mongoose, 500, etc.)
 * into a stable summary + optional field map.
 */
export function parseHttpApiError(error: unknown): ParsedHttpApiError {
  const { status, body } = readBody(error);
  const fieldErrors: Record<string, string> = {};
  let summary = '';

  if (isRecord(body)) {
    const message = typeof body['message'] === 'string' ? body['message'].trim() : '';
    const errorsRaw = body['errors'];

    if (Array.isArray(errorsRaw) && errorsRaw.length > 0) {
      const first = errorsRaw[0];
      if (isRecord(first) && typeof first['path'] === 'string') {
        Object.assign(fieldErrors, collectExpressValidatorErrors(errorsRaw));
        summary =
          message ||
          Object.values(fieldErrors)[0] ||
          'Validation failed';
      } else if (typeof first === 'string') {
        summary = message || errorsRaw.join('. ');
      } else {
        summary = message || 'Validation failed';
      }
    } else {
      summary = message;
    }
  }

  if (!summary && error instanceof HttpErrorResponse && typeof error.message === 'string') {
    summary = error.message;
  }

  if (status === 401) {
    summary = summary || 'Session expired. Please sign in again.';
  } else if (status === 403) {
    summary = summary || "You don't have permission to perform this action.";
  } else if (status >= 500) {
    summary = environment.production
      ? 'Something went wrong. Please try again later.'
      : summary || 'Server error';
  } else if (status === 400 && !summary) {
    summary = 'Invalid request. Please check your input.';
  } else if (!summary) {
    summary = 'Request failed';
  }

  return { httpStatus: status, summary, fieldErrors };
}

/** Single string for notifications. */
export function apiErrorSummary(error: unknown): string {
  return parseHttpApiError(error).summary;
}
