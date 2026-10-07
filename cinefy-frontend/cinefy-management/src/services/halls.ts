import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Hall,
  HallDetail,
  HallLayout,
  HallStatus,
  HallStatusCounts,
  HallSummary,
  HallType,
} from '../shared/types';

const API_PREFIX = '/halls';

@Injectable({ providedIn: 'root' })
export class HallsService {
  private readonly http = inject(HttpClient);

  getHallTypes(context?: HttpContext): Observable<HallType[]> {
    return this.http.get<HallType[]>(`${API_PREFIX}/types`, { context });
  }

  createHallType(data: HallType): Observable<HallType> {
    return this.http.post<HallType>(`${API_PREFIX}/types`, data);
  }

  updateHallType(id: string, data: HallType): Observable<HallType> {
    return this.http.put<HallType>(`${API_PREFIX}/types/${id}`, data);
  }

  deleteHallType(id: string): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/types/${id}`);
  }

  getHalls(
    excludeHallId?: string,
    statuses?: HallStatus[],
    context?: HttpContext,
  ): Observable<HallSummary[]> {
    const params = {
      ...(excludeHallId && { excludeHallId }),
      ...(statuses && statuses.length > 0 && { statuses: statuses.join(',') }),
    };
    return this.http.get<HallSummary[]>(API_PREFIX, { params, context });
  }

  getHallStatusCounts(context?: HttpContext): Observable<HallStatusCounts> {
    return this.http.get<HallStatusCounts>(`${API_PREFIX}/status-counts`, { context });
  }

  getHall(id: string, context?: HttpContext): Observable<HallDetail> {
    return this.http.get<HallDetail>(`${API_PREFIX}/${id}`, { context });
  }

  getHallLayout(id: string): Observable<HallLayout> {
    return this.http.get<HallLayout>(`${API_PREFIX}/${id}/layout`);
  }

  createHall(data: Hall): Observable<HallSummary> {
    return this.http.post<HallSummary>(API_PREFIX, data);
  }

  updateHall(id: string, data: Hall): Observable<HallSummary> {
    return this.http.put<HallSummary>(`${API_PREFIX}/${id}`, data);
  }

  deleteHall(id: string): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/${id}`);
  }
}
