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
  status: 'NOW_SHOWING' | 'SCHEDULED' | 'UNDER_MAINTENANCE' | 'INACTIVE' | 'ACTIVE' | null;
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
  status: string;
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
  status: string;
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
  status: string;
  typeId: string;
  supports3D?: boolean;
  layout?: Record<string, string[]>;
  ticketPricing: TicketPricing[];
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
};
