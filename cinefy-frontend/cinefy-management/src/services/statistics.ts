import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import type { DateRange, StatisticsSummary } from '../shared/types';

const MOCK_LATENCY_MS = 600;

const MOCK_SUMMARY: StatisticsSummary = {
  current: {
    netRevenue: 816995,
    refunded: 36817,
    ticketsSold: 7932,
    occupancy: 0.676,
  },
  previous: {
    netRevenue: 571896,
    refunded: 28493,
    ticketsSold: 6584,
    occupancy: 0.582,
  },
};

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  getSummary(_range: DateRange): Observable<StatisticsSummary> {
    return of(MOCK_SUMMARY).pipe(delay(MOCK_LATENCY_MS));
  }
}
