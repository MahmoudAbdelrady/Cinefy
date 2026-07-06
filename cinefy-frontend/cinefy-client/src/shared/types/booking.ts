import type { MovieSearchResult } from './movies';
import type { SeatCategory, SeatLayoutResponse } from './seats';

interface BookingShowtime {
  id: string;
  time: string;
  is3D: boolean;
  fullyReserved: boolean;
}

interface HallTypeShowtimes {
  hallType: string;
  showtimes: BookingShowtime[];
}

interface ActiveBooking {
  id: string;
  positions: string[];
  expiresAt: string;
}

interface SeatSelection {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  fullyReserved: boolean;
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

export type {
  BookingShowtime,
  HallTypeShowtimes,
  SeatSelection,
  ActiveBooking,
  BookingSummary,
  BookedSeat,
  BookingDetail,
  BookingRequest,
};
