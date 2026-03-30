export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageCount: number;
  pageSize: number;
}
