import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  USER_POSITION_LABELS,
  type CoverageChange,
  type PositionCoverage,
  type PositionCoverageItem,
  type UserPosition,
} from '../../../shared/types';
import { skipServerErrorToast } from '../../../app/core/interceptors';
import { StaffService } from '../../../services';
import { InfoIcon, WarningIcon } from '../../../shared/icons';
import { CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';

@Component({
  selector: 'staff-position-coverage',
  imports: [CinefyLoadingSpinner, CinefyEmptyState, LucideDynamicIcon],
  templateUrl: './staff-position-coverage.html',
  styleUrl: './staff-position-coverage.scss',
})
export class StaffPositionCoverageComponent {
  protected readonly icons = { info: InfoIcon, warning: WarningIcon };

  private readonly staffService = inject(StaffService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly positionLabels = USER_POSITION_LABELS;

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly positionCoverageItems = signal<PositionCoverage | null>(null);

  constructor() {
    afterNextRender(() => {
      this.staffService
        .getPositionCoverage(skipServerErrorToast())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (coverage) => {
            this.positionCoverageItems.set(coverage);
            this.loading.set(false);
          },
          error: () => {
            this.failed.set(true);
            this.loading.set(false);
          },
        });
    });
  }

  applyChange(change: CoverageChange): void {
    const coverage = this.positionCoverageItems();
    if (!coverage) return;

    const positions = coverage.positions.map((p) => ({ ...p }));

    if (change.action === 'add') {
      this.adjustPositionCount(positions, change.position, 1);
      this.positionCoverageItems.set({ total: coverage.total + 1, positions });
    } else if (change.action === 'delete') {
      this.adjustPositionCount(positions, change.position, -1);
      this.positionCoverageItems.set({
        total: Math.max(0, coverage.total - 1),
        positions,
      });
    } else {
      this.adjustPositionCount(positions, change.from, -1);
      this.adjustPositionCount(positions, change.to, 1);
      this.positionCoverageItems.set({ total: coverage.total, positions });
    }
  }

  protected percentage(count: number): number {
    const total = this.positionCoverageItems()?.total ?? 0;
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }

  private adjustPositionCount(
    positions: PositionCoverageItem[],
    position: UserPosition,
    delta: number,
  ): void {
    const entry = positions.find((p) => p.position === position);
    if (entry) {
      entry.count = Math.max(0, entry.count + delta);
    } else if (delta > 0) {
      positions.push({ position, count: delta });
    }
  }
}
