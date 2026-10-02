import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { HallsService } from '../../../services';
import { LayoutIcon, SettingsIcon, WarningIcon } from '../../../shared/icons';
import { HALL_STATUS_LABELS } from '../../../shared/types';
import type { HallStatus, HallStatusCounts } from '../../../shared/types';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

interface HallStatusCount {
  status: HallStatus;
  label: string;
  count: number;
}

@Component({
  selector: 'halls-summary',
  imports: [DashboardWidgetComponent, CinefyLoadingSpinner, CinefyEmptyState],
  templateUrl: './halls-summary.html',
  styleUrl: './halls-summary.scss',
})
export class HallsSummaryComponent {
  protected readonly icons = { LayoutIcon, SettingsIcon, WarningIcon };

  private readonly hallsService = inject(HallsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly hallCounts = signal<HallStatusCounts | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly statusCounts = computed<HallStatusCount[]>(() => {
    const counts = this.hallCounts();
    if (!counts) return [];

    return (Object.entries(counts) as [HallStatus, number][]).map(([status, count]) => ({
      status,
      label: HALL_STATUS_LABELS[status],
      count,
    }));
  });

  protected readonly barSegments = computed(() =>
    this.statusCounts().filter((entry) => entry.count > 0),
  );

  protected readonly totalHalls = computed(() =>
    this.statusCounts().reduce((sum, entry) => sum + entry.count, 0),
  );

  constructor() {
    afterNextRender(() => this.load());
  }

  private load(): void {
    this.hallsService
      .getHallStatusCounts(skipServerErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (counts) => {
          this.hallCounts.set(counts);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
