export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
