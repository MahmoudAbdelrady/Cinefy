import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Calendar, Clock, Film } from 'lucide-angular';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { StatsComponent } from '../../stats/stats';
import { ShowtimeEventsService, ShowtimesService, ToastService } from '../../../services';
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
  private readonly destroyRef = inject(DestroyRef);

  protected statistics = signal<ShowtimesStatistics | null>(null);
  protected loading = signal(true);

  protected readonly cards = computed<StatsCard[]>(() => {
    const s = this.statistics();
    return [
      { label: 'Total Movies', value: s?.totalMovies?.toString() ?? '—', icon: Film },
      { label: 'Total Showtimes', value: s?.totalShowtimes?.toString() ?? '—', icon: Calendar },
      { label: "Today's Showtimes", value: s?.todayShowtimes?.toString() ?? '—', icon: Clock },
    ];
  });

  constructor() {
    this.refetchStatistics(true);

    effect(() => {
      if (!this.showtimeEvents.created()) return;
      this.refetchStatistics(false);
    });

    effect(() => {
      if (!this.showtimeEvents.deleted()) return;
      this.refetchStatistics(false);
    });
  }

  private refetchStatistics(showLoading: boolean): void {
    if (showLoading) this.loading.set(true);
    this.showtimesService
      .getShowtimesStatistics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
