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

interface ActiveBooking {
  id: string;
  positions: string[];
  expiresAt: string;
}

interface ShowtimeSeatSelection {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  fullyReserved: boolean;
  hallLayout: ShowtimeHallLayout;
  activeBooking?: ActiveBooking;
}

type PaymentType = 'CASH' | 'CARD';

interface BookingRequest {
  showtimeId: string;
  seats: string[];
}

interface Booking {
  id: string;
}

interface StaffPaymentRequest {
  paymentType: PaymentType;
  paidAmount?: number;
  paymentReference?: string;
}

export type {
  ShowtimeSeatLayout,
  ShowtimeHallLayout,
  ActiveBooking,
  ShowtimeSeatSelection,
  PaymentType,
  BookingRequest,
  Booking,
  StaffPaymentRequest,
};
