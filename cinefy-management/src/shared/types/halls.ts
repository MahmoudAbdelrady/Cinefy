const HALL_STATUS_LABELS = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  NOW_SHOWING: 'Now Showing',
  UNDER_MAINTENANCE: 'Under Maintenance',
  INACTIVE: 'Inactive',
} as const;

type HallStatus = keyof typeof HALL_STATUS_LABELS;

const ACTIVE_HALL_STATUSES: HallStatus[] = ['ACTIVE', 'SCHEDULED', 'NOW_SHOWING'];

const SEAT_CATEGORY_LABELS = {
  NORMAL: 'Normal',
  VIP: 'VIP',
  AISLE: 'Space/Aisle',
} as const;

type SeatCategory = keyof typeof SEAT_CATEGORY_LABELS;

interface Seat {
  type: SeatCategory;
  onsiteOnly: boolean;
}

interface SeatCategoryItem {
  name: string;
  type: SeatCategory;
}

interface SeatLayout {
  categories: Partial<Record<SeatCategory, string[]>>;
  onSiteOnly: string[];
}

interface HallRef {
  id: string;
  name: string;
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
  layout: SeatLayout;
  ticketPricing: TicketPricing[];
}

interface HallLayout {
  numberOfRows: number;
  seatsPerRow: number;
  layout: SeatLayout;
  ticketPricing: TicketPricing[];
}

interface HallStatistics {
  totalHalls: number;
  activeHalls: number;
  totalCapacity: number;
}

interface Hall {
  name: string;
  numberOfRows: number;
  seatsPerRow: number;
  status: HallStatus;
  typeId: string;
  supports3D?: boolean;
  layout?: SeatLayout;
  ticketPricing: TicketPricing[];
}

type StatisticsChange =
  | { action: 'set'; totalHalls: number; activeHalls: number; totalCapacity: number }
  | { action: 'reset' }
  | { action: 'add'; status: HallStatus; capacity: number }
  | { action: 'delete'; status: HallStatus; capacity: number }
  | {
      action: 'update';
      from: { status: HallStatus; capacity: number };
      to: { status: HallStatus; capacity: number };
    };

export { HALL_STATUS_LABELS, SEAT_CATEGORY_LABELS, ACTIVE_HALL_STATUSES };
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
  StatisticsChange,
};
