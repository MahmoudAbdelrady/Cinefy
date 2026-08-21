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

export type { DateRange, SalesPoint, StatisticsPeriodTotals, StatisticsSummary };
