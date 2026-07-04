interface SeatLayout {
  categories: {
    AISLE?: string[];
    VIP?: string[];
  };
  onSiteOnly: string[];
  reserved: string[];
  myReserved?: string[];
}

type SeatCategory = 'NORMAL' | 'VIP';

type SeatKind = SeatCategory | 'TAKEN' | 'AISLE';

const SEAT_KIND_LABEL: Record<Exclude<SeatKind, 'AISLE'>, string> = {
  NORMAL: 'Normal',
  VIP: 'Premium',
  TAKEN: 'Taken',
};

interface TicketPrice {
  price: number;
  seatCategory: SeatCategory;
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
export type { Seat, SeatCategory, SeatKind, SeatLayout, SeatLayoutResponse, TicketPrice };
