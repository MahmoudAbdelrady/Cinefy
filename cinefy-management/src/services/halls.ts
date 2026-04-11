import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PaginatedResponse,
  Hall,
  HallDetail,
  HallLayout,
  HallSummary,
  HallType,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class HallsService {
  private readonly http = inject(HttpClient);

  // ========================= Hall Types =========================

  getHallTypes(): Observable<HallType[]> {
    return this.http.get<HallType[]>('/halls/types');
  }

  createHallType(data: HallType): Observable<HallType> {
    return this.http.post<HallType>('/halls/types', data);
  }

  updateHallType(id: string, data: HallType): Observable<HallType> {
    return this.http.put<HallType>(`/halls/types/${id}`, data);
  }

  deleteHallType(id: string): Observable<void> {
    return this.http.delete<void>(`/halls/types/${id}`);
  }

  // ============================= Halls ===========================

  getHalls(
    search?: string,
    pageable?: { page?: number; size?: number },
    excludeHallId?: string,
  ): Observable<PaginatedResponse<HallSummary>> {
    const params = {
      ...(search && { search }),
      ...pageable,
      ...(excludeHallId && { excludeHallId }),
    };
    return this.http.get<PaginatedResponse<HallSummary>>('/halls', { params });
  }

  getHall(id: string): Observable<HallDetail> {
    return this.http.get<HallDetail>(`/halls/${id}`);
  }

  getHallLayout(id: string): Observable<HallLayout> {
    return this.http.get<HallLayout>(`/halls/${id}/layout`);
  }

  createHall(data: Hall): Observable<HallSummary> {
    return this.http.post<HallSummary>('/halls', data);
  }

  updateHall(id: string, data: Hall): Observable<HallSummary> {
    return this.http.put<HallSummary>(`/halls/${id}`, data);
  }

  deleteHall(id: string): Observable<void> {
    return this.http.delete<void>(`/halls/${id}`);
  }
}
