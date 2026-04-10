const HALL_STATUS_LABELS = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  NOW_SHOWING: 'Now Showing',
  UNDER_MAINTENANCE: 'Under Maintenance',
  INACTIVE: 'Inactive',
} as const;

type HallStatus = keyof typeof HALL_STATUS_LABELS;

const SEAT_CATEGORY_LABELS = {
  NORMAL: 'Normal',
  VIP: 'VIP',
  AISLE: 'Space/Aisle',
} as const;

type SeatCategory = keyof typeof SEAT_CATEGORY_LABELS;

interface SeatCategoryItem {
  name: string;
  type: SeatCategory;
}

interface HallType {
  id?: string;
  name: string;
}

interface HallItem {
  id: string;
  name: string;
  status: HallStatus | null;
  rows: number;
  seatsPerRow: number;
  currentMovie: string | null;
  occupancy: number;
}

interface TicketPricing {
  seatCategory: SeatCategory;
  price: number;
}

interface HallSummary {
  id: string;
  name: string;
  status: HallStatus;
  typeName: string;
  supports3D: boolean;
  totalRows: number;
  totalColumns: number;
}

interface HallDetail {
  id: string;
  name: string;
  numberOfRows: number;
  seatsPerRow: number;
  status: HallStatus;
  type: HallType;
  supports3D: boolean;
  layout: Partial<Record<SeatCategory, string[]>>;
  ticketPricing: TicketPricing[];
}

interface HallLayout {
  numberOfRows: number;
  seatsPerRow: number;
  layout: Partial<Record<SeatCategory, string[]>>;
  ticketPricing: TicketPricing[];
}

interface Hall {
  name: string;
  numberOfRows: number;
  seatsPerRow: number;
  status: HallStatus;
  typeId: string;
  supports3D?: boolean;
  layout?: Partial<Record<SeatCategory, string[]>>;
  ticketPricing: TicketPricing[];
}

export { HALL_STATUS_LABELS, SEAT_CATEGORY_LABELS };
export type {
  HallStatus,
  SeatCategory,
  SeatCategoryItem,
  HallType,
  HallItem,
  TicketPricing,
  HallSummary,
  HallDetail,
  HallLayout,
  Hall,
};
