import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Eye, LayoutDashboard, LucideAngularModule, TrendingUp, Users } from 'lucide-angular';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { HallsService, ToastService } from '../../../services';
import type { HallStatistics } from '../../../shared/types';

@Component({
  selector: 'halls-statistics',
  imports: [LucideAngularModule, LoadingSpinnerComponent],
  templateUrl: './halls-statistics.html',
  styleUrl: './halls-statistics.scss',
})
export class HallsStatisticsComponent {
  private readonly hallsService = inject(HallsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected statistics = signal<HallStatistics | null>(null);
  protected loading = signal(true);

  protected LayoutIcon = LayoutDashboard;
  protected EyeIcon = Eye;
  protected UsersIcon = Users;
  protected TrendingUpIcon = TrendingUp;

  constructor() {
    this.hallsService
      .getHallsStatistics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.statistics.set(stats);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load statistics');
        },
      });
  }
}
