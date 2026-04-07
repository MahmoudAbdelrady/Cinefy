import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HallType } from '../shared/types';

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
}
