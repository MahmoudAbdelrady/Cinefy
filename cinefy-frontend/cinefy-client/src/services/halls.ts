import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HallType } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class HallsService {
  private readonly http = inject(HttpClient);

  getHallTypes(): Observable<HallType[]> {
    return this.http.get<HallType[]>('/halls/types');
  }
}
