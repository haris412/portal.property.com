/** Normalized result after reading a failed API JSON body (see `parseHttpApiError`). */
export interface ParsedHttpApiError {
  httpStatus: number;
  /** Safe text for toasts / banners. */
  summary: string;
  /** express-validator style: `path` → `msg`. */
  fieldErrors: Record<string, string>;
}
