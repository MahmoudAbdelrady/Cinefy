import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  CinefyPaginator,
} from 'cinefy-ui/components';
import { ClapperboardIcon, WarningIcon } from '../../../shared/icons';
import { DEFAULT_PAGE_SIZE } from '../../../shared/constants';
import { StatisticsService } from '../../../services';
import { CURRENCY } from '../../../shared/types';
import type { DateRange, MoviePerformance } from '../../../shared/types';

interface MovieRow {
  rank: number;
  movieTitle: string;
  netRevenue: number;
  refunded: number;
  totalShowtimes: number;
  ticketsSold: number;
  totalSeats: number;
  occupancy: number;
}

@Component({
  selector: 'movie-performance',
  imports: [LoadingSpinnerComponent, EmptyStateComponent, CinefyPaginator, DecimalPipe],
  templateUrl: './movie-performance.html',
  styleUrl: './movie-performance.scss',
})
export class MoviePerformanceComponent {
  protected readonly icons = {
    ClapperboardIcon,
    WarningIcon,
  };

  private readonly statisticsService = inject(StatisticsService);

  protected readonly currency = CURRENCY;
  protected readonly pageSize = DEFAULT_PAGE_SIZE;

  readonly range = input.required<DateRange>();

  protected readonly movies = signal<MoviePerformance[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly pageCount = signal(1);
  protected readonly page = linkedSignal<DateRange, number>({
    source: this.range,
    computation: () => 0,
  });
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly rows = computed<MovieRow[]>(() =>
    this.movies().map((movie, index) => ({
      rank: this.page() * this.pageSize + index + 1,
      movieTitle: movie.movieTitle,
      netRevenue: movie.netRevenue,
      refunded: movie.refunded,
      totalShowtimes: movie.totalShowtimes,
      ticketsSold: movie.ticketsSold,
      totalSeats: movie.totalSeats,
      occupancy: movie.totalSeats === 0 ? 0 : (movie.ticketsSold / movie.totalSeats) * 100,
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const sub = this.load(this.range(), this.page());
      onCleanup(() => sub.unsubscribe());
    });
  }

  private load(range: DateRange, page: number): Subscription {
    this.loading.set(true);
    this.failed.set(false);
    return this.statisticsService.getMoviePerformance(range, page, this.pageSize).subscribe({
      next: (response) => {
        this.movies.set(response.content);
        this.totalItems.set(response.page.totalElements);
        this.pageCount.set(Math.max(1, response.page.totalPages));
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
