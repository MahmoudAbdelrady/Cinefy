import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { DurationPipe } from 'cinefy-ui/pipes';
import { BookingSectionComponent, TrailerModalComponent } from '../../components';
import { MoviesService } from '../../services';
import { ClockIcon, EyeIcon, PlayIcon, TriangleAlertIcon, UserIcon } from '../../shared/icons';

interface CrewMember {
  name: string;
  role: string;
}

@Component({
  selector: 'movie-detail-page',
  imports: [
    LucideDynamicIcon,
    NgpButton,
    NgpDialogTrigger,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    MediaImageComponent,
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

  protected readonly bookingOpened = signal(true);

  private readonly movieId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('movieId')))),
  );

  protected readonly movieResource = rxResource({
    params: () => this.movieId(),
    stream: ({ params: id }) => this.moviesService.getMovieDetails(id),
  });

  protected readonly movie = this.movieResource.value;

  protected readonly notFound = computed(() => {
    const error = this.movieResource.error();
    return error instanceof HttpErrorResponse && error.status === 404;
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
