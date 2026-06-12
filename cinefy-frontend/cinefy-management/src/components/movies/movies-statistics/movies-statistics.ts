import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { CalendarIcon, ClockIcon, ClapperboardIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
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
  private readonly destroyRef = inject(DestroyRef);

  private readonly refetch$ = new Subject<void>();

  protected statistics = signal<ShowtimesStatistics | null>(null);
  protected loading = signal(true);

  protected readonly cards = computed<StatsCard[]>(() => {
    const s = this.statistics();
    return [
      { label: 'Total Movies', value: s?.totalMovies?.toString() ?? '—', icon: ClapperboardIcon },
      { label: 'Total Showtimes', value: s?.totalShowtimes?.toString() ?? '—', icon: CalendarIcon },
      { label: "Today's Showtimes", value: s?.todayShowtimes?.toString() ?? '—', icon: ClockIcon },
    ];
  });

  constructor() {
    this.refetch$
      .pipe(
        switchMap(() => this.showtimesService.getShowtimesStatistics()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (stats) => {
          this.statistics.set(stats);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load statistics');
        },
      });

    afterNextRender(() => this.refetch$.next());

    merge(this.showtimeEvents.created$, this.showtimeEvents.deleted$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refetch$.next());
  }
}
