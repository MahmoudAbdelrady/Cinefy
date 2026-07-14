import type { SeatCategory, TicketPricing } from './halls';

interface ShowtimeSeatLayout {
  categories: Partial<Record<SeatCategory, string[]>>;
  onSiteOnly: string[];
  reserved: string[];
}

interface ShowtimeHallLayout {
  numberOfRows: number;
  seatsPerRow: number;
  layout: ShowtimeSeatLayout;
  ticketPricing: TicketPricing[];
}

interface ShowtimeSeatSelection {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  fullyReserved: boolean;
  hallLayout: ShowtimeHallLayout;
}

export type { ShowtimeSeatLayout, ShowtimeHallLayout, ShowtimeSeatSelection };
