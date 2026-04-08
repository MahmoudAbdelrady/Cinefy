const HALL_STATUS_LABELS = {
  NOW_SHOWING: 'Now Showing',
  SCHEDULED: 'Scheduled',
  UNDER_MAINTENANCE: 'Under Maintenance',
  INACTIVE: 'Inactive',
  ACTIVE: 'Active',
} as const;

type HallStatus = keyof typeof HALL_STATUS_LABELS;

interface HallType {
  id?: string;
  name: string;
}

interface HallListItem {
  id: string;
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
  seatCategory: string;
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
  layout: Record<string, string[]>;
  ticketPricing: TicketPricing[];
}

interface HallLayout {
  numberOfRows: number;
  seatsPerRow: number;
  layout: Record<string, string[]>;
  ticketPricing: TicketPricing[];
}

interface Hall {
  name: string;
  numberOfRows: number;
  seatsPerRow: number;
  status: HallStatus;
  typeId: string;
  supports3D?: boolean;
  layout?: Record<string, string[]>;
  ticketPricing: TicketPricing[];
}

export { HALL_STATUS_LABELS };
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
};
