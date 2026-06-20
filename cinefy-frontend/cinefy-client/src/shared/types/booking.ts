import type { SeatLayoutResponse } from './seats';

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

interface SeatSelection {
  movieTitle: string;
  startDateTime: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  hallLayout: SeatLayoutResponse;
}

export type { BookingShowtime, HallTypeShowtimes, SeatSelection };
