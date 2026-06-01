export type BookingStatus = 'active' | 'completed'

export interface Booking {
  id: string
  movieId: string
  showtimeId: string
  /** denormalized for easy rendering in the mock */
  movieTitle: string
  poster: [string, string]
  /** real poster image (TMDB); falls back to the gradient when absent */
  posterUrl?: string
  time: string
  hall: string
  format: string
  date: string
  seats: string[]
  priceCentsEach: number
  status: BookingStatus
}

/** Seed bookings so My Tickets + Booking History have content on first load. */
const TMDB_W500 = 'https://image.tmdb.org/t/p/w500'

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bk-3391',
    movieId: 'deadpool-wolverine',
    showtimeId: 'st-0-1430-1',
    movieTitle: 'Deadpool & Wolverine',
    poster: ['oklch(0.5 0.13 25)', 'oklch(0.24 0.06 20)'],
    posterUrl: `${TMDB_W500}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg`,
    time: '14:30',
    hall: 'Hall 5',
    format: '3D',
    date: 'Today',
    seats: ['F7', 'F8'],
    priceCentsEach: 1700,
    status: 'active',
  },
  {
    id: 'bk-3370',
    movieId: 'inside-out-2',
    showtimeId: 'st-0-1530-2',
    movieTitle: 'Inside Out 2',
    poster: ['oklch(0.6 0.13 280)', 'oklch(0.3 0.06 285)'],
    posterUrl: `${TMDB_W500}/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg`,
    time: '15:30',
    hall: 'Hall 6',
    format: '2D',
    date: 'Today',
    seats: ['C4'],
    priceCentsEach: 1200,
    status: 'active',
  },
  {
    id: 'bk-2204',
    movieId: 'dune-part-two',
    showtimeId: 'st-0-1800-2',
    movieTitle: 'Dune: Part Two',
    poster: ['oklch(0.55 0.13 65)', 'oklch(0.28 0.06 45)'],
    posterUrl: `${TMDB_W500}/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg`,
    time: '18:00',
    hall: 'Hall 1',
    format: 'IMAX',
    date: 'Mar 14, 2026',
    seats: ['H10', 'H11', 'H12'],
    priceCentsEach: 1900,
    status: 'completed',
  },
  {
    id: 'bk-1988',
    movieId: 'oppenheimer',
    showtimeId: 'st-0-1930-1',
    movieTitle: 'Oppenheimer',
    poster: ['oklch(0.5 0.06 50)', 'oklch(0.24 0.03 40)'],
    posterUrl: `${TMDB_W500}/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg`,
    time: '19:30',
    hall: 'Hall 4',
    format: '70mm',
    date: 'Feb 2, 2026',
    seats: ['E15', 'E16'],
    priceCentsEach: 2500,
    status: 'completed',
  },
]

export const bookingTotalCents = (b: Booking) => b.seats.length * b.priceCentsEach

export interface PaymentMethod {
  id: string
  brand: 'Visa' | 'Mastercard' | 'Amex'
  last4: string
  expiry: string
  primary: boolean
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', brand: 'Visa', last4: '4242', expiry: '08/27', primary: true },
  { id: 'pm-2', brand: 'Mastercard', last4: '8819', expiry: '11/26', primary: false },
]
