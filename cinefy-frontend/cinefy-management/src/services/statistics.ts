import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaginatedResponse } from 'cinefy-ui/types';
import type { DateRange, MoviePerformance, SalesPoint, StatisticsSummary } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);

  getSummary(range: DateRange): Observable<StatisticsSummary> {
    return this.http.get<StatisticsSummary>('/statistics/summary', {
      params: { from: range.from, to: range.to },
    });
  }

  getSales(range: DateRange): Observable<SalesPoint[]> {
    return this.http.get<SalesPoint[]>('/statistics/sales', {
      params: { from: range.from, to: range.to },
    });
  }

  getMoviePerformance(
    range: DateRange,
    page: number,
    size: number,
  ): Observable<PaginatedResponse<MoviePerformance>> {
    return this.http.get<PaginatedResponse<MoviePerformance>>('/statistics/movies', {
      params: { from: range.from, to: range.to, page, size },
    });
  }
}
