import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { CinefyLoadingSpinner } from 'cinefy-ui/components';
import { StaffService } from '../../../services';
import { ContactRoundIcon, UsersIcon } from '../../../shared/icons';
import { USER_POSITION_LABELS } from '../../../shared/types';
import type { OnShiftSummary, UserPosition } from '../../../shared/types';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

interface ShiftCount {
  position: UserPosition;
  label: string;
  count: number;
}

@Component({
  selector: 'on-shift-summary',
  imports: [DashboardWidgetComponent, CinefyLoadingSpinner],
  templateUrl: './on-shift-summary.html',
  styleUrl: './on-shift-summary.scss',
})
export class OnShiftSummaryComponent {
  protected readonly icons = { ContactRoundIcon, UsersIcon };

  private readonly staffService = inject(StaffService);

  private readonly onShift = signal<OnShiftSummary | null>(null);
  protected readonly loading = signal(true);

  protected readonly positionCounts = computed<ShiftCount[]>(() => {
    const details = this.onShift()?.details;
    if (!details) return [];

    return (Object.entries(details) as [UserPosition, number][]).map(([position, count]) => ({
      position,
      label: USER_POSITION_LABELS[position],
      count,
    }));
  });

  protected readonly subtitle = computed(() => {
    const onShift = this.positionCounts().reduce((sum, entry) => sum + entry.count, 0);
    return `${onShift} of ${this.onShift()?.total ?? 0} staff`;
  });

  constructor() {
    afterNextRender(() => this.load());
  }

  private load(): void {
    this.staffService.getOnShiftSummary().subscribe({
      next: (summary) => {
        this.onShift.set(summary);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
