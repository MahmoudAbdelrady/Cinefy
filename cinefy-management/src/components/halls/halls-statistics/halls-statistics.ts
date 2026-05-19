import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Eye, LayoutDashboard, TrendingUp, Users } from 'lucide-angular';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { StatsComponent } from '../../stats/stats';
import { HallsService, ToastService } from '../../../services';
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
      { label: 'Total Halls', value: s?.totalHalls?.toString() ?? '—', icon: LayoutDashboard },
      { label: 'Active Halls', value: s?.activeHalls?.toString() ?? '—', icon: Eye },
      { label: 'Total Capacity', value: s?.totalCapacity?.toString() ?? '—', icon: Users },
      { label: 'Occupancy Rate', value: '44%', icon: TrendingUp },
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
