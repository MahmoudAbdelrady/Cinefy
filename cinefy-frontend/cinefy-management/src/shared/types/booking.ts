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
  isCash: boolean;
  transactionId?: string;
}

type PaymentState = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

interface BookingConfirmation {
  id: string;
  paymentState: PaymentState;
  bookingReference: string;
  ticketToken: string | null;
  movie: MovieSearchResult;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  seats: BookedSeat[];
  totalPrice: number;
}

export type {
  ShowtimeSeatLayout,
  ShowtimeHallLayout,
  ActiveBooking,
  ShowtimeSeatSelection,
  BookedSeat,
  BookingDetail,
  BookingRequest,
  BookingSummary,
  StaffPaymentRequest,
  PaymentState,
  BookingConfirmation,
};
