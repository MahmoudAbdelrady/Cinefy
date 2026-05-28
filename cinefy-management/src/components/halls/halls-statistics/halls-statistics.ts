import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EyeIcon, LayoutIcon, TrendingUpIcon, UsersIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent, ToastService } from 'cinefy-ui';
import { StatsComponent } from '../../stats/stats';
import { HallsService } from '../../../services';
import type { HallStatistics, StatsCard } from '../../../shared/types';

@Component({
  selector: 'halls-statistics',
  imports: [LoadingSpinnerComponent, StatsComponent],
  templateUrl: './halls-statistics.html',
  styleUrl: './halls-statistics.scss',
})
export class HallsStatisticsComponent {
  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);

  protected statistics = signal<HallStatistics | null>(null);
  protected loading = signal(true);

  protected readonly cards = computed<StatsCard[]>(() => {
    const s = this.statistics();
    return [
      { label: 'Total Halls', value: s?.totalHalls?.toString() ?? '—', icon: LayoutIcon },
      { label: 'Active Halls', value: s?.activeHalls?.toString() ?? '—', icon: EyeIcon },
      { label: 'Total Capacity', value: s?.totalCapacity?.toString() ?? '—', icon: UsersIcon },
      { label: 'Occupancy Rate', value: '44%', icon: TrendingUpIcon },
    ];
  });

  constructor() {
    afterNextRender(() => {
      this.hallsService.getHallsStatistics().subscribe({
        next: (stats) => {
          this.statistics.set(stats);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load statistics');
        },
      });
    });
  }
}
