import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { PaginatedResponse } from 'cinefy-ui/types';
import type { DateRange, MoviePerformance, SalesPoint, StatisticsSummary } from '../shared/types';

const MOCK_LATENCY_MS = 600;
const AVERAGE_TICKET_PRICE = 103;

const MOCK_SUMMARY: StatisticsSummary = {
  current: {
    netRevenue: 816995,
    refunded: 36817,
    ticketsSold: 7932,
    occupancy: 67.6,
  },
  previous: {
    netRevenue: 571896,
    refunded: 28493,
    ticketsSold: 6584,
    occupancy: 58.2,
  },
};

const MOCK_MOVIE_PERFORMANCE: MoviePerformance[] = [
  {
    movieTitle: 'Dune: Part Three',
    netRevenue: 214830,
    refunded: 6420,
    totalShowtimes: 38,
    ticketsSold: 5104,
    totalSeats: 6270,
  },
  {
    movieTitle: 'The Batman II',
    netRevenue: 168420,
    refunded: 0,
    totalShowtimes: 31,
    ticketsSold: 4012,
    totalSeats: 5115,
  },
  {
    movieTitle: 'Spider-Man: Beyond',
    netRevenue: 152990,
    refunded: 4880,
    totalShowtimes: 29,
    ticketsSold: 3744,
    totalSeats: 4785,
  },
  {
    movieTitle: 'Inside Out 3',
    netRevenue: 121450,
    refunded: 2310,
    totalShowtimes: 26,
    ticketsSold: 3180,
    totalSeats: 4290,
  },
  {
    movieTitle: 'Mission: Impossible - Afterburn',
    netRevenue: 98760,
    refunded: 0,
    totalShowtimes: 22,
    ticketsSold: 2464,
    totalSeats: 3630,
  },
  {
    movieTitle: 'A Quiet Place: Origins',
    netRevenue: 76310,
    refunded: 1980,
    totalShowtimes: 19,
    ticketsSold: 1957,
    totalSeats: 3135,
  },
  {
    movieTitle: 'The Grand Budapest Sequel',
    netRevenue: 54200,
    refunded: 0,
    totalShowtimes: 16,
    ticketsSold: 1408,
    totalSeats: 2640,
  },
  {
    movieTitle: 'Wicked: For Good',
    netRevenue: 41870,
    refunded: 3140,
    totalShowtimes: 14,
    ticketsSold: 1092,
    totalSeats: 2310,
  },
  {
    movieTitle: 'Nosferatu Reborn',
    netRevenue: 28640,
    refunded: 0,
    totalShowtimes: 11,
    ticketsSold: 748,
    totalSeats: 1815,
  },
  {
    movieTitle: 'The Last Voyage',
    netRevenue: 19320,
    refunded: 890,
    totalShowtimes: 9,
    ticketsSold: 517,
    totalSeats: 1485,
  },
  {
    movieTitle: 'Echoes of Tomorrow',
    netRevenue: 12480,
    refunded: 0,
    totalShowtimes: 7,
    ticketsSold: 336,
    totalSeats: 1155,
  },
  {
    movieTitle: 'Midnight in Cairo',
    netRevenue: 7150,
    refunded: 420,
    totalShowtimes: 5,
    ticketsSold: 198,
    totalSeats: 825,
  },
];

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  getSummary(_range: DateRange): Observable<StatisticsSummary> {
    return of(MOCK_SUMMARY).pipe(delay(MOCK_LATENCY_MS));
  }

  getSales(range: DateRange): Observable<SalesPoint[]> {
    return of(mockSalesPoints(range)).pipe(delay(MOCK_LATENCY_MS));
  }

  getMoviePerformance(
    _range: DateRange,
    page: number,
    size: number,
  ): Observable<PaginatedResponse<MoviePerformance>> {
    const start = page * size;
    return of({
      content: MOCK_MOVIE_PERFORMANCE.slice(start, start + size),
      page: {
        totalElements: MOCK_MOVIE_PERFORMANCE.length,
        totalPages: Math.ceil(MOCK_MOVIE_PERFORMANCE.length / size),
        number: page,
        size,
      },
    }).pipe(delay(MOCK_LATENCY_MS));
  }
}

function mockSalesPoints(range: DateRange): SalesPoint[] {
  const days = eachDayOfInterval({ start: parseISO(range.from), end: parseISO(range.to) });

  return days.map((day, index) => {
    const weekday = day.getDay();
    const weekendBoost = weekday === 4 || weekday === 5 ? 1.6 : 1;
    const wave = 1 + 0.35 * Math.sin(index * 1.7);
    const netRevenue = Math.round(24000 * weekendBoost * wave);
    return {
      date: format(day, 'yyyy-MM-dd'),
      details: {
        netRevenue,
        refunded: index % 4 === 0 ? Math.round(netRevenue * 0.06) : 0,
        ticketsSold: Math.round(netRevenue / AVERAGE_TICKET_PRICE),
        occupancy: Math.min(95, 42 * weekendBoost * wave),
      },
    };
  });
}
