import type { MovieSearchResult } from './movies';
import type { SelectableSeatCategory, SeatLayoutResponse } from './seats';

interface BookingShowtime {
  id: string;
  time: string;
  is3D: boolean;
  fullyBooked: boolean;
}

interface HallTypeShowtimes {
  hallType: string;
  showtimes: BookingShowtime[];
}

interface ActiveBooking {
  id: string;
  seats: string[];
  expiresAt: string;
}

interface SeatSelection {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  fullyBooked: boolean;
  hallLayout: SeatLayoutResponse;
  activeBooking?: ActiveBooking;
}

interface BookingSummary {
  id: string;
  expiresAt: string;
  movie: MovieSearchResult;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  totalTickets: number;
  totalPrice: number;
}

interface BookedSeat {
  position: string;
  category: SelectableSeatCategory;
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
  totalPrice: number;
}

type PaymentState = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

interface BookingConfirmation {
  id: string;
  paymentState: PaymentState;
  bookingReference?: string;
  qrCode?: string;
  movie: MovieSearchResult;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  seats: BookedSeat[];
  totalPrice: number;
}

interface PastBooking {
  id: string;
  movie: MovieSearchResult;
  startDateTime: string;
  hallType: string;
  is3D: boolean;
  refunded: boolean;
  totalPrice: number;
}

interface BookingRequest {
  showtimeId: string;
  seats: string[];
}

interface PaymentRedirection {
  redirectionUrl: string;
}

export type {
  BookingShowtime,
  HallTypeShowtimes,
  SeatSelection,
  ActiveBooking,
  BookingSummary,
  BookedSeat,
  BookingDetail,
  PaymentState,
  BookingConfirmation,
  PastBooking,
  BookingRequest,
  PaymentRedirection,
};
