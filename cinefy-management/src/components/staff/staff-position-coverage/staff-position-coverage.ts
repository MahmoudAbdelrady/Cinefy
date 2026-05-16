import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { STAFF_POSITION_LABELS, type PositionCoverage } from '../../../shared/types';
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly positionCoverageItems = signal<PositionCoverage | null>(null);
  protected readonly positionLabels = STAFF_POSITION_LABELS;

  constructor() {
    afterNextRender(() => {
      this.staffService
        .getPositionCoverage()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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

  protected percentage(count: number): number {
    const total = this.positionCoverageItems()?.total ?? 0;
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }
}
