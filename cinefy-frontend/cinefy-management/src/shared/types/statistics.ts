const CURRENCY = 'EGP';

interface DateRange {
  from: string;
  to: string;
}

interface StatisticsPeriodTotals {
  netRevenue: number;
  refunded: number;
  ticketsSold: number;
  occupancy: number;
}

interface StatisticsSummary {
  current: StatisticsPeriodTotals;
  previous: StatisticsPeriodTotals;
}

interface SalesPoint {
  date: string;
  details: StatisticsPeriodTotals;
}

interface MoviePerformance {
  movieTitle: string;
  netRevenue: number;
  refunded: number;
  totalShowtimes: number;
  ticketsSold: number;
  totalSeats: number;
}

export { CURRENCY };
export type { DateRange, MoviePerformance, SalesPoint, StatisticsPeriodTotals, StatisticsSummary };
