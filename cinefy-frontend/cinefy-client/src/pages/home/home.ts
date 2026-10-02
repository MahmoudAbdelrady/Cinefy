import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CinefyEmptyState, CinefyLoadingSpinner, CinefyMediaImage } from 'cinefy-ui/components';
import { FeaturedCarouselComponent } from '../../components';
import { skipServerErrorToast } from '../../app/core/interceptors';
import { MoviesService } from '../../services';
import { ClapperboardIcon, CalendarIcon, TriangleAlertIcon } from '../../shared/icons';

const NOW_SHOWING_LIMIT = 5;

@Component({
  selector: 'home-page',
  imports: [
    FeaturedCarouselComponent,
    CinefyMediaImage,
    RouterLink,
    DatePipe,
    CinefyEmptyState,
    CinefyLoadingSpinner,
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
