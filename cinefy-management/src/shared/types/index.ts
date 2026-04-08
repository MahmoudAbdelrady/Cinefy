export interface PageFields {
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: PageFields;
}

export { HALL_STATUS_LABELS } from './halls';
export type {
  HallStatus,
  HallType,
  HallListItem,
  HallItem,
  TicketPricing,
  HallSummary,
  HallDetail,
  HallLayout,
  Hall,
} from './halls';
