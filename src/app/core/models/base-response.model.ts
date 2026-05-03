// Transport-level wrapper returned by every HttpService method.
// HttpService never throws — it always resolves to BaseResponse<T>.
// isSuccess = true  → HTTP call succeeded, result holds the response body.
// isSuccess = false → HTTP call failed, errorMessage explains why.
export class BaseResponse<T> {
  isSuccess!: boolean;
  result!: T;
  errorMessage?: string;
  statusCode?: number;

  // Called by HttpService on every 2xx response.
  static success<T>(result: T): BaseResponse<T> {
    const res = new BaseResponse<T>();
    res.isSuccess = true;
    res.result = result;
    return res;
  }

  // Called by HttpService when the HTTP call fails and there is no partial result to return.
  static error<T>(errorMessage: string, statusCode?: number): BaseResponse<T> {
    const res = new BaseResponse<T>();
    res.isSuccess = false;
    res.result = null as unknown as T;
    res.errorMessage = errorMessage;
    res.statusCode = statusCode;
    return res;
  }

  // Used for 403 Forbidden: the API may return partial data (e.g. subscription info)
  // alongside the error, so we preserve result AND mark it as failed.
  static errorWithResult<T>(result: T, errorMessage: string, statusCode?: number): BaseResponse<T> {
    const res = new BaseResponse<T>();
    res.isSuccess = false;
    res.result = result;
    res.errorMessage = errorMessage;
    res.statusCode = statusCode;
    return res;
  }
}
