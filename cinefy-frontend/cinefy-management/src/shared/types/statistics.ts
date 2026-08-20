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

export type { DateRange, StatisticsPeriodTotals, StatisticsSummary };
