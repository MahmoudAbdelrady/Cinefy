import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { FeaturedCarouselComponent } from '../../components';
import { MoviesService } from '../../services';
import { ClapperboardIcon, CalendarIcon } from '../../shared/icons';

@Component({
  selector: 'home-page',
  imports: [
    FeaturedCarouselComponent,
    MediaImageComponent,
    RouterLink,
    DatePipe,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly icons = {
    ClapperboardIcon,
    CalendarIcon,
  };

  private readonly moviesService = inject(MoviesService);

  private static readonly NOW_SHOWING_LIMIT = 5;

  protected readonly highlightedMovies = toSignal(this.moviesService.getHighlighted());

  protected readonly nowShowingMovies = toSignal(
    this.moviesService.getNowShowing(HomePage.NOW_SHOWING_LIMIT),
  );

  protected readonly upcomingMovies = toSignal(this.moviesService.getAnnouncedUpcoming());

  protected readonly highlightedLoading = computed(() => this.highlightedMovies() === undefined);

  protected readonly nowShowingLoading = computed(() => this.nowShowingMovies() === undefined);

  protected readonly upcomingLoading = computed(() => this.upcomingMovies() === undefined);
}
