interface SeatLayout {
  categories: {
    AISLE?: string[];
    VIP?: string[];
  };
  onSiteOnly: string[];
  reserved: string[];
}

type SeatCategory = 'NORMAL' | 'VIP';

type SeatKind = SeatCategory | 'TAKEN' | 'AISLE';

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

export type { Seat, SeatCategory, SeatKind, SeatLayout, SeatLayoutResponse, TicketPrice };
