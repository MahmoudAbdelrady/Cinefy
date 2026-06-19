interface SeatLayout {
  categories: {
    AISLE?: string[];
    VIP?: string[];
  };
  onSiteOnly: string[];
  reserved: string[];
}

interface SeatLayoutResponse {
  numberOfRows: number;
  seatsPerRow: number;
  layout: SeatLayout;
}

type SeatKind = 'NORMAL' | 'VIP' | 'TAKEN' | 'AISLE';

interface Seat {
  id: string;
  row: string;
  number: number;
  kind: SeatKind;
}

export type { Seat, SeatKind, SeatLayout, SeatLayoutResponse };
