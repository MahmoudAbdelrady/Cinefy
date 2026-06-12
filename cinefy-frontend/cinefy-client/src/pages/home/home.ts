import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent, MediaImageComponent } from 'cinefy-ui/components';
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

  protected readonly highlightedMovies = toSignal(this.moviesService.getHighlighted(), {
    initialValue: [],
  });

  protected readonly nowShowingMovies = toSignal(
    this.moviesService.getNowShowing(HomePage.NOW_SHOWING_LIMIT),
    { initialValue: [] },
  );

  protected readonly upcomingMovies = toSignal(this.moviesService.getAnnouncedUpcoming(), {
    initialValue: [],
  });
}
