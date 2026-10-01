import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { StaffService } from '../../../services';
import { ContactRoundIcon, UsersIcon, WarningIcon } from '../../../shared/icons';
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
  imports: [DashboardWidgetComponent, CinefyLoadingSpinner, CinefyEmptyState],
  templateUrl: './on-shift-summary.html',
  styleUrl: './on-shift-summary.scss',
})
export class OnShiftSummaryComponent {
  protected readonly icons = { ContactRoundIcon, UsersIcon, WarningIcon };

  private readonly staffService = inject(StaffService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly onShift = signal<OnShiftSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

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
    this.staffService
      .getOnShiftSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.onShift.set(summary);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
