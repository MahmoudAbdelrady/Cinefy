import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CalendarIcon, ClockIcon, FilmIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent, ToastService } from 'cinefy-ui';
import { StatsComponent } from '../../stats/stats';
import { ShowtimeEventsService, ShowtimesService } from '../../../services';
import type { ShowtimesStatistics, StatsCard } from '../../../shared/types';

@Component({
  selector: 'movies-statistics',
  imports: [LoadingSpinnerComponent, StatsComponent],
  templateUrl: './movies-statistics.html',
  styleUrl: './movies-statistics.scss',
})
export class MoviesStatisticsComponent {
  private readonly showtimesService = inject(ShowtimesService);
  private readonly showtimeEvents = inject(ShowtimeEventsService);
  private readonly toastService = inject(ToastService);

  protected statistics = signal<ShowtimesStatistics | null>(null);
  protected loading = signal(true);

  protected readonly cards = computed<StatsCard[]>(() => {
    const s = this.statistics();
    return [
      { label: 'Total Movies', value: s?.totalMovies?.toString() ?? '—', icon: FilmIcon },
      { label: 'Total Showtimes', value: s?.totalShowtimes?.toString() ?? '—', icon: CalendarIcon },
      { label: "Today's Showtimes", value: s?.todayShowtimes?.toString() ?? '—', icon: ClockIcon },
    ];
  });

  constructor() {
    afterNextRender(() => this.refetchStatistics(true));

    effect(() => {
      if (!this.showtimeEvents.created()) return;
      untracked(() => this.refetchStatistics(false));
    });

    effect(() => {
      if (!this.showtimeEvents.deleted()) return;
      untracked(() => this.refetchStatistics(false));
    });
  }

  private refetchStatistics(showLoading: boolean): void {
    if (showLoading) this.loading.set(true);
    this.showtimesService.getShowtimesStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        if (showLoading) this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (showLoading) this.loading.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to load statistics');
      },
    });
  }
}
