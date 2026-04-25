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

export { HALL_STATUS_LABELS, SEAT_CATEGORY_LABELS, ACTIVE_HALL_STATUSES } from './halls';
export type {
  HallStatus,
  SeatCategory,
  Seat,
  SeatCategoryItem,
  SeatLayout,
  HallRef,
  HallType,
  HallItem,
  TicketPricing,
  HallSummary,
  HallDetail,
  HallLayout,
  HallStatistics,
  Hall,
} from './halls';

export type { Movie, MovieSearchResult, MovieDetail } from './movies';

export { SHOWTIME_STATUS_LABELS } from './showtimes';
export type {
  ShowtimeStatus,
  ShowtimeDraft,
  Showtime,
  PublishShowtimesInput,
  MovieWithShowtimes,
  ShowtimesStatistics,
  MovieShowtimeListItem,
  MovieShowtimeDatesResponse,
  MovieShowtimesResponse,
  EditableShowtime,
} from './showtimes';

export type { StatsCard } from './stats';
