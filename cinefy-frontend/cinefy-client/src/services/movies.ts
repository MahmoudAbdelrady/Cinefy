import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HighlightedMovie } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  getHighlighted(): Observable<HighlightedMovie[]> {
    return this.http.get<HighlightedMovie[]>('/movies/highlighted');
  }
}
