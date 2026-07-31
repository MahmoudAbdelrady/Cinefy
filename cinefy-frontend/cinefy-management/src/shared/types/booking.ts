import type { SeatCategory, TicketPricing } from './halls';
import type { MovieSearchResult } from './movies';

interface ShowtimeSeatLayout {
  categories: Partial<Record<SeatCategory, string[]>>;
  onSiteOnly: string[];
  booked: string[];
}

interface ShowtimeHallLayout {
  numberOfRows: number;
  seatsPerRow: number;
  layout: ShowtimeSeatLayout;
  ticketPricing: TicketPricing[];
}

interface ActiveBooking {
  id: string;
  seats: string[];
  expiresAt: string;
}

interface ShowtimeSeatSelection {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  fullyBooked: boolean;
  hallLayout: ShowtimeHallLayout;
  activeBooking?: ActiveBooking;
}

type PaymentType = 'CASH' | 'CARD';

interface BookedSeat {
  position: string;
  category: SeatCategory;
  price: number;
}

interface BookingDetail {
  id: string;
  expiresAt: string;
  movie: MovieSearchResult;
  showtimeId: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  seats: BookedSeat[];
}

interface BookingRequest {
  showtimeId: string;
  seats: string[];
}

interface BookingSummary {
  id: string;
  showtimeId: string;
  expiresAt: string;
  movie: MovieSearchResult;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  totalTickets: number;
  totalPrice: number;
}

interface StaffPaymentRequest {
  paymentType: PaymentType;
  transactionId?: string;
}

interface IssuedTicket {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  seats: BookedSeat[];
  total: number;
  paymentType: PaymentType;
  transactionId: string;
}

export type {
  ShowtimeSeatLayout,
  ShowtimeHallLayout,
  ActiveBooking,
  ShowtimeSeatSelection,
  PaymentType,
  BookedSeat,
  BookingDetail,
  BookingRequest,
  BookingSummary,
  StaffPaymentRequest,
  IssuedTicket,
};
