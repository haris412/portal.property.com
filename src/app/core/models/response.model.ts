/**
 * Typical REST envelope from the API (`success`, `data`, `message`, `statusCode`).
 * `data` may be a list, a single entity, or another shape depending on the route.
 */
export interface ResponseModel<T> {
  success?: boolean;
  data: T;
  message?: string;
  statusCode?: number;
}
