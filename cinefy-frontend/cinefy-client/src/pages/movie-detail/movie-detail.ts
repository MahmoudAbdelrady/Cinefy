import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CinefyEmptyState,
  CinefyLoadingSpinner,
  CinefyMediaImage,
} from 'cinefy-ui/components';
import { DurationPipe } from 'cinefy-ui/pipes';
import { BookingSectionComponent, TrailerModalComponent } from '../../components';
import { MoviesService } from '../../services';
import { skipErrorToast } from '../../app/core/interceptors';
import { ClockIcon, EyeIcon, PlayIcon, TriangleAlertIcon, UserIcon } from '../../shared/icons';
import type { ApiError } from '../../shared/types';

interface CrewMember {
  name: string;
  role: string;
}

@Component({
  selector: 'movie-detail-page',
  imports: [
    LucideDynamicIcon,
    CinefyEmptyState,
    CinefyLoadingSpinner,
    CinefyMediaImage,
    DurationPipe,
    BookingSectionComponent,
    TrailerModalComponent,
  ],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.scss',
})
export class MovieDetailPage {
  protected readonly icons = {
    ClockIcon,
    EyeIcon,
    PlayIcon,
    TriangleAlertIcon,
    UserIcon,
  };

  private readonly route = inject(ActivatedRoute);

  private readonly moviesService = inject(MoviesService);

  private readonly movieId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('movieId')))),
  );

  protected readonly trailerVisible = signal(false);

  protected readonly movieResource = rxResource({
    params: () => this.movieId(),
    stream: ({ params: id }) => this.moviesService.getMovieDetails(id, skipErrorToast()),
  });

  protected readonly movie = this.movieResource.value;

  protected readonly errorMessage = computed(() => {
    const error = this.movieResource.error();
    const message = error instanceof HttpErrorResponse ? (error.error as ApiError)?.message : null;
    return message ?? 'Something went wrong. Please try again later.';
  });

  protected readonly directors = computed<CrewMember[]>(
    () =>
      this.movie()?.credits?.directors.map((member) => ({ name: member.name, role: 'Director' })) ??
      [],
  );

  protected readonly cast = computed<CrewMember[]>(
    () => this.movie()?.credits?.cast.map((member) => ({ name: member.name, role: 'Cast' })) ?? [],
  );
}
