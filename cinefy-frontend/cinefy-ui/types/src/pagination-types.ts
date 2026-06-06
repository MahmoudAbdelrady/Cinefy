interface PageFields {
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: PageFields;
}
