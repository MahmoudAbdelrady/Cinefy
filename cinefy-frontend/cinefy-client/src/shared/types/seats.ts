interface SeatLayout {
  categories: {
    AISLE?: string[];
    VIP?: string[];
  };
  onSiteOnly: string[];
  booked: string[];
}

type SelectableSeatCategory = 'NORMAL' | 'VIP';

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

export type { SelectableSeatCategory, SeatLayout, SeatLayoutResponse, TicketPrice };
