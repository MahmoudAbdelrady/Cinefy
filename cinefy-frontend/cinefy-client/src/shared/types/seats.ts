interface SeatLayout {
  categories: {
    AISLE?: string[];
    VIP?: string[];
  };
  onSiteOnly: string[];
  reserved: string[];
}

type SelectableSeatCategory = 'NORMAL' | 'VIP';

type SeatKind = SelectableSeatCategory | 'TAKEN' | 'AISLE';

const SEAT_KIND_LABEL: Record<SeatKind, string> = {
  NORMAL: 'Normal',
  VIP: 'Premium',
  TAKEN: 'Taken',
  AISLE: 'Aisle',
};

interface TicketPrice {
  price: number;
  seatCategory: SelectableSeatCategory;
}

interface SeatLayoutResponse {
  numberOfRows: number;
  seatsPerRow: number;
  layout: SeatLayout;
  ticketPricing: TicketPrice[];
}

interface Seat {
  id: string;
  row: string;
  number: number;
  kind: SeatKind;
}

export { SEAT_KIND_LABEL };
export type { Seat, SelectableSeatCategory, SeatKind, SeatLayout, SeatLayoutResponse, TicketPrice };
