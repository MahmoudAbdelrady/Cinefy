import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EyeIcon, LayoutIcon, TrendingUpIcon, UsersIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { StatsComponent } from '../../stats/stats';
import { HallsService } from '../../../services';
import {
  type HallStatus,
  type HallStatistics,
  type StatisticsChange,
  type StatsCard,
} from '../../../shared/types';

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

  applyChange(change: StatisticsChange): void {
    const stats = this.statistics();
    if (!stats) return;

    let totalHallsDelta = 0;
    let activeHallsDelta = 0;
    let capacityDelta = 0;

    if (change.action === 'add') {
      totalHallsDelta = 1;
      activeHallsDelta = this.activeContribution(change.status);
      capacityDelta = change.capacity;
    } else if (change.action === 'delete') {
      totalHallsDelta = -1;
      activeHallsDelta = -this.activeContribution(change.status);
      capacityDelta = -change.capacity;
    } else {
      activeHallsDelta =
        this.activeContribution(change.to.status) - this.activeContribution(change.from.status);
      capacityDelta = change.to.capacity - change.from.capacity;
    }

    this.statistics.set({
      totalHalls: Math.max(0, stats.totalHalls + totalHallsDelta),
      activeHalls: Math.max(0, stats.activeHalls + activeHallsDelta),
      totalCapacity: Math.max(0, stats.totalCapacity + capacityDelta),
    });
  }

  private activeContribution(status: HallStatus): number {
    return status === 'ACTIVE' ? 1 : 0;
  }
}
