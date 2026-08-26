import { Component, computed, signal } from '@angular/core';
import { LayoutIcon } from '../../../shared/icons';
import { HALL_STATUS_LABELS } from '../../../shared/types';
import type { HallStatus } from '../../../shared/types';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

interface HallStatusCount {
  status: HallStatus;
  label: string;
  count: number;
}

const HALL_COUNTS: Record<HallStatus, number> = {
  ACTIVE: 5,
  SCHEDULED: 1,
  UNDER_MAINTENANCE: 1,
  INACTIVE: 1,
};

@Component({
  selector: 'halls-summary',
  imports: [DashboardWidgetComponent],
  templateUrl: './halls-summary.html',
  styleUrl: './halls-summary.scss',
})
export class HallsSummaryComponent {
  protected readonly icons = { LayoutIcon };

  private readonly hallCounts = signal<Record<HallStatus, number>>(HALL_COUNTS);

  protected readonly statusCounts = computed<HallStatusCount[]>(() =>
    (Object.entries(this.hallCounts()) as [HallStatus, number][]).map(([status, count]) => ({
      status,
      label: HALL_STATUS_LABELS[status],
      count,
    })),
  );

  protected readonly barSegments = computed(() =>
    this.statusCounts().filter((entry) => entry.count > 0),
  );

  protected readonly totalHalls = computed(() =>
    this.statusCounts().reduce((sum, entry) => sum + entry.count, 0),
  );
}
