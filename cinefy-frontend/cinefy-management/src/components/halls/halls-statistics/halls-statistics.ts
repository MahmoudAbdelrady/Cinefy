import { Component, computed, signal } from '@angular/core';
import { EyeIcon, LayoutIcon, UsersIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { StatsComponent } from '../../stats/stats';
import { type HallStatus, type StatisticsChange, type StatsCard } from '../../../shared/types';

interface HallStatistics {
  totalHalls: number;
  activeHalls: number;
  totalCapacity: number;
}

@Component({
  selector: 'halls-statistics',
  imports: [LoadingSpinnerComponent, StatsComponent],
  templateUrl: './halls-statistics.html',
  styleUrl: './halls-statistics.scss',
})
export class HallsStatisticsComponent {
  protected statistics = signal<HallStatistics | null>(null);
  protected loading = signal(true);

  protected readonly cards = computed<StatsCard[]>(() => {
    const s = this.statistics();
    return [
      { label: 'Total Halls', value: s?.totalHalls?.toString() ?? '—', icon: LayoutIcon },
      { label: 'Active Halls', value: s?.activeHalls?.toString() ?? '—', icon: EyeIcon },
      { label: 'Total Capacity', value: s?.totalCapacity?.toString() ?? '—', icon: UsersIcon },
    ];
  });

  applyChange(change: StatisticsChange): void {
    if (change.action === 'set') {
      this.statistics.set({
        totalHalls: change.totalHalls,
        activeHalls: change.activeHalls,
        totalCapacity: change.totalCapacity,
      });
      this.loading.set(false);
      return;
    }

    if (change.action === 'reset') {
      this.statistics.set(null);
      this.loading.set(false);
      return;
    }

    const stats = this.statistics();
    if (!stats) return;

    let totalHallsDelta = 0;
    let activeHallsDelta = 0;
    let capacityDelta = 0;

    switch (change.action) {
      case 'add':
        totalHallsDelta = 1;
        activeHallsDelta = this.activeContribution(change.status);
        capacityDelta = change.capacity;
        break;
      case 'update':
        activeHallsDelta =
          this.activeContribution(change.to.status) - this.activeContribution(change.from.status);
        capacityDelta = change.to.capacity - change.from.capacity;
        break;
      case 'delete':
        totalHallsDelta = -1;
        activeHallsDelta = -this.activeContribution(change.status);
        capacityDelta = -change.capacity;
        break;
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
