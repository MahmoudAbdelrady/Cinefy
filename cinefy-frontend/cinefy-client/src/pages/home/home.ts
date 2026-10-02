import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  CinefyEmptyState,
  CinefyErrorState,
  CinefyLoadingSpinner,
  CinefyMediaImage,
} from 'cinefy-ui/components';
import { FeaturedCarouselComponent } from '../../components';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { MoviesService } from '../../services';
import { ClapperboardIcon, CalendarIcon } from '../../shared/icons';

const NOW_SHOWING_LIMIT = 5;

@Component({
  selector: 'home-page',
  imports: [
    FeaturedCarouselComponent,
    CinefyMediaImage,
    RouterLink,
    DatePipe,
    CinefyEmptyState,
    CinefyErrorState,
    CinefyLoadingSpinner,
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

  protected readonly highlightedMovies = rxResource({
    stream: () => this.moviesService.getHighlighted(skipServerErrorToast()),
  });

  protected readonly nowShowingMovies = rxResource({
    stream: () => this.moviesService.getNowShowing(NOW_SHOWING_LIMIT, skipServerErrorToast()),
  });

  protected readonly upcomingMovies = rxResource({
    stream: () => this.moviesService.getAnnouncedUpcoming(skipServerErrorToast()),
  });
}
