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

export type { BookingShowtime, HallTypeShowtimes };
