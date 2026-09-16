import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HallType } from '../shared/types';

const API_PREFIX = '/halls';

@Injectable({ providedIn: 'root' })
export class HallsService {
  private readonly http = inject(HttpClient);

  getHallTypes(): Observable<HallType[]> {
    return this.http.get<HallType[]>(`${API_PREFIX}/types`);
  }
}
