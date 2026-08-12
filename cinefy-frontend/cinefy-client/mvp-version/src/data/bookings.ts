export type BookingStatus = 'active' | 'completed' | 'refunded';

export interface Booking {
  id: string;
  movieId: string;
  showtimeId: string;
  /** denormalized for easy rendering in the mock */
  movieTitle: string;
  poster: [string, string];
  /** real poster image (TMDB); falls back to the gradient when absent */
  posterUrl?: string;
  time: string;
  hall: string;
  format: string;
  date: string;
  seats: string[];
  priceCentsEach: number;
  status: BookingStatus;
}

/** Seed bookings so My Tickets + Booking History have content on first load. */
const TMDB_W500 = 'https://image.tmdb.org/t/p/w500';

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
    id: 'bk-2310',
    movieId: 'gladiator-ii',
    showtimeId: 'st-0-1900-1',
    movieTitle: 'Gladiator II',
    poster: ['oklch(0.55 0.1 70)', 'oklch(0.26 0.05 55)'],
    posterUrl: `${TMDB_W500}/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg`,
    time: '19:00',
    hall: 'Hall 1',
    format: 'IMAX',
    date: 'Mar 28, 2026',
    seats: [
      'L1',
      'L2',
      'L3',
      'L4',
      'L5',
      'L6',
      'L7',
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
    ],
    priceCentsEach: 1900,
    status: 'completed',
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
  {
    id: 'bk-1954',
    movieId: 'wicked',
    showtimeId: 'st-0-1700-3',
    movieTitle: 'Wicked',
    poster: ['oklch(0.55 0.13 155)', 'oklch(0.26 0.06 165)'],
    posterUrl: `${TMDB_W500}/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg`,
    time: '17:00',
    hall: 'Hall 2',
    format: '2D',
    date: 'Jan 24, 2026',
    seats: ['D5', 'D6'],
    priceCentsEach: 1500,
    status: 'completed',
  },
  {
    id: 'bk-1921',
    movieId: 'gladiator-ii',
    showtimeId: 'st-0-2015-1',
    movieTitle: 'Gladiator II',
    poster: ['oklch(0.55 0.1 70)', 'oklch(0.26 0.05 55)'],
    posterUrl: `${TMDB_W500}/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg`,
    time: '20:15',
    hall: 'Hall 1',
    format: 'IMAX',
    date: 'Jan 11, 2026',
    seats: ['G8'],
    priceCentsEach: 1900,
    status: 'completed',
  },
  {
    id: 'bk-1877',
    movieId: 'kingdom-apes',
    showtimeId: 'st-0-1345-2',
    movieTitle: 'Kingdom of the Planet of the Apes',
    poster: ['oklch(0.52 0.1 145)', 'oklch(0.26 0.05 155)'],
    posterUrl: `${TMDB_W500}/gKkl37BQuKTanygYQG1pyYgLVgf.jpg`,
    time: '13:45',
    hall: 'Hall 6',
    format: '2D',
    date: 'Dec 29, 2025',
    seats: ['B2', 'B3', 'B4'],
    priceCentsEach: 1200,
    status: 'refunded',
  },
  {
    id: 'bk-1830',
    movieId: 'furiosa',
    showtimeId: 'st-0-2045-5',
    movieTitle: 'Furiosa: A Mad Max Saga',
    poster: ['oklch(0.55 0.13 50)', 'oklch(0.26 0.06 35)'],
    posterUrl: `${TMDB_W500}/iADOJ8Zymht2JPMoy3R7xceZprc.jpg`,
    time: '20:45',
    hall: 'Hall 5',
    format: '3D',
    date: 'Dec 12, 2025',
    seats: ['J1', 'J2'],
    priceCentsEach: 1700,
    status: 'completed',
  },
  {
    id: 'bk-1794',
    movieId: 'inside-out-2',
    showtimeId: 'st-0-1115-6',
    movieTitle: 'Inside Out 2',
    poster: ['oklch(0.6 0.13 280)', 'oklch(0.3 0.06 285)'],
    posterUrl: `${TMDB_W500}/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg`,
    time: '11:15',
    hall: 'Hall 6',
    format: '2D',
    date: 'Nov 30, 2025',
    seats: ['A7', 'A8', 'A9', 'A10'],
    priceCentsEach: 1200,
    status: 'completed',
  },
  {
    id: 'bk-1755',
    movieId: 'deadpool-wolverine',
    showtimeId: 'st-0-2200-5',
    movieTitle: 'Deadpool & Wolverine',
    poster: ['oklch(0.5 0.13 25)', 'oklch(0.24 0.06 20)'],
    posterUrl: `${TMDB_W500}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg`,
    time: '22:00',
    hall: 'Hall 5',
    format: '3D',
    date: 'Nov 15, 2025',
    seats: ['K11', 'K12'],
    priceCentsEach: 1700,
    status: 'completed',
  },
  {
    id: 'bk-1702',
    movieId: 'dune-part-two',
    showtimeId: 'st-0-1600-4',
    movieTitle: 'Dune: Part Two',
    poster: ['oklch(0.55 0.13 65)', 'oklch(0.28 0.06 45)'],
    posterUrl: `${TMDB_W500}/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg`,
    time: '16:00',
    hall: 'Hall 4',
    format: '70mm',
    date: 'Oct 27, 2025',
    seats: ['F3'],
    priceCentsEach: 2500,
    status: 'refunded',
  },
  {
    id: 'bk-1668',
    movieId: 'oppenheimer',
    showtimeId: 'st-0-1845-2',
    movieTitle: 'Oppenheimer',
    poster: ['oklch(0.5 0.06 50)', 'oklch(0.24 0.03 40)'],
    posterUrl: `${TMDB_W500}/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg`,
    time: '18:45',
    hall: 'Hall 2',
    format: '2D',
    date: 'Oct 9, 2025',
    seats: ['C12', 'C13'],
    priceCentsEach: 1500,
    status: 'completed',
  },
  {
    id: 'bk-1601',
    movieId: 'wicked',
    showtimeId: 'st-0-1430-2',
    movieTitle: 'Wicked',
    poster: ['oklch(0.55 0.13 155)', 'oklch(0.26 0.06 165)'],
    posterUrl: `${TMDB_W500}/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg`,
    time: '14:30',
    hall: 'Hall 2',
    format: '2D',
    date: 'Sep 21, 2025',
    seats: ['H4', 'H5'],
    priceCentsEach: 1500,
    status: 'completed',
  },
];

export const bookingTotalCents = (b: Booking) => b.seats.length * b.priceCentsEach;

/** Mirrors the saved-method payload the payment provider returns. */
export interface PaymentMethod {
  id: string;
  masked_pan: string;
  card_subtype: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', masked_pan: 'xxxx-xxxx-xxxx-0008', card_subtype: 'MasterCard' },
  { id: 'pm-2', masked_pan: 'xxxx-xxxx-xxxx-4242', card_subtype: 'Visa' },
];

/** Short mono chip label for a subtype, e.g. "MasterCard" → "MC". */
export function subtypeChip(cardSubtype: string): string {
  const key = cardSubtype.toLowerCase().replace(/\s+/g, '');
  if (key === 'mastercard') return 'MC';
  if (key === 'americanexpress' || key === 'amex') return 'AMEX';
  if (key === 'visa') return 'VISA';
  return cardSubtype.slice(0, 4).toUpperCase();
}
