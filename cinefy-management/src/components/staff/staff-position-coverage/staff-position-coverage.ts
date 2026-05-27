import { afterNextRender, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  USER_POSITION_LABELS,
  type CoverageChange,
  type PositionCoverage,
  type PositionCoverageItem,
  type UserPosition,
} from '../../../shared/types';
import { StaffService, ToastService } from '../../../services';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'staff-position-coverage',
  imports: [LoadingSpinnerComponent],
  templateUrl: './staff-position-coverage.html',
  styleUrl: './staff-position-coverage.scss',
})
export class StaffPositionCoverageComponent {
  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);

  protected readonly positionLabels = USER_POSITION_LABELS;

  protected readonly loading = signal(true);
  protected readonly positionCoverageItems = signal<PositionCoverage | null>(null);

  constructor() {
    afterNextRender(() => {
      this.staffService.getPositionCoverage().subscribe({
        next: (coverage) => {
          this.positionCoverageItems.set(coverage);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load position coverage');
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
