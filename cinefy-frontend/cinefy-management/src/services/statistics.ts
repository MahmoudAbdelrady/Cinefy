import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { DateRange, SalesPoint, StatisticsSummary } from '../shared/types';

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

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  getSummary(_range: DateRange): Observable<StatisticsSummary> {
    return of(MOCK_SUMMARY).pipe(delay(MOCK_LATENCY_MS));
  }

  getSales(range: DateRange): Observable<SalesPoint[]> {
    return of(mockSalesPoints(range)).pipe(delay(MOCK_LATENCY_MS));
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
