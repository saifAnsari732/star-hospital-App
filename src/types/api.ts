export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    currentPage?: number;
    totalPages?: number;
    totalCount?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface ApiQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, string | number | boolean>;
}
