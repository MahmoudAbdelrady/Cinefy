import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { FeaturedCarouselComponent } from '../../components';
import { MoviesService } from '../../services';
import { ClapperboardIcon, CalendarIcon, TriangleAlertIcon } from '../../shared/icons';

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
    TriangleAlertIcon,
  };

  private readonly moviesService = inject(MoviesService);

  private static readonly NOW_SHOWING_LIMIT = 5;

  protected readonly highlightedMovies = rxResource({
    stream: () => this.moviesService.getHighlighted(),
  });

  protected readonly nowShowingMovies = rxResource({
    stream: () => this.moviesService.getNowShowing(HomePage.NOW_SHOWING_LIMIT),
  });

  protected readonly upcomingMovies = rxResource({
    stream: () => this.moviesService.getAnnouncedUpcoming(),
  });
}
