export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type {
  HallType,
  HallListItem,
  HallItem,
  TicketPricing,
  HallSummary,
  HallDetail,
  HallLayout,
  Hall,
} from './halls';
