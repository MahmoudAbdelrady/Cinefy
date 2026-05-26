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

export type { ApiError, ApiErrorCode } from './api';

export type {
  LoginPayload,
  ForgotPasswordPayload,
  VerifyResetCodePayload,
  ResetPasswordPayload,
} from './auth';

export type { Movie, MovieSearchResult, MovieDetail } from './movies';

export {
  PAYMENT_METHOD_TYPE_LABELS,
  PAYMENT_METHOD_STATUS_LABELS,
  PAYMENT_METHOD_TEST_STATUS_LABELS,
} from './payment';
export type {
  PaymentMethodType,
  PaymentMethodStatus,
  PaymentMethodTestStatus,
  PaymentMethod,
  PaymentMethodSummary,
  PaymentMethodDetail,
  PaymentMethodTestResult,
  PaymentMethodStatusRequest,
  TestConnectionRequest,
} from './payment';

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

export {
  STAFF_POSITION_LABELS,
  USER_POSITION_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WEEK_DAY_LABELS,
} from './staff';
export type {
  StaffMember,
  StaffMemberSummary,
  StaffMemberDetail,
  CurrentStaffMember,
  StaffMemberPayload,
  StaffPosition,
  UserPosition,
  EmploymentType,
  WeekDay,
  PositionCoverage,
  PositionCoverageItem,
  CoverageChange,
} from './staff';
