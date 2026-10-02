import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaginatedResponse } from 'cinefy-ui/types';
import type { DateRange, MoviePerformance, SalesPoint, StatisticsSummary } from '../shared/types';

const API_PREFIX = '/statistics';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);

  getSummary(range: DateRange, context?: HttpContext): Observable<StatisticsSummary> {
    return this.http.get<StatisticsSummary>(`${API_PREFIX}/summary`, {
      params: { from: range.from, to: range.to },
      context,
    });
  }

  getSales(range: DateRange, context?: HttpContext): Observable<SalesPoint[]> {
    return this.http.get<SalesPoint[]>(`${API_PREFIX}/sales`, {
      params: { from: range.from, to: range.to },
      context,
    });
  }

  getMoviePerformance(
    range: DateRange,
    page: number,
    size: number,
    context?: HttpContext,
  ): Observable<PaginatedResponse<MoviePerformance>> {
    return this.http.get<PaginatedResponse<MoviePerformance>>(`${API_PREFIX}/movies`, {
      params: { from: range.from, to: range.to, page, size },
      context,
    });
  }
}
