import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { Tooltip } from 'primeng/tooltip';
import { CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import {
  ChartColumnIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WarningIcon,
} from '../../../shared/icons';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { StatisticsService } from '../../../services';
import { CURRENCY } from '../../../shared/types';
import type { DateRange, SalesPoint, StatisticsPeriodTotals } from '../../../shared/types';

const TRACK_HEIGHT_PX = 130;
const MIN_BAR_HEIGHT_PX = 3;

interface SalesBar {
  date: string;
  details: StatisticsPeriodTotals;
  grossRevenue: number;
  heightPx: number;
}

function grossRevenueOf(details: StatisticsPeriodTotals): number {
  return details.netRevenue + details.refunded;
}

@Component({
  selector: 'sales-chart',
  imports: [
    CinefyLoadingSpinner,
    CinefyEmptyState,
    DecimalPipe,
    DatePipe,
    Tooltip,
    LucideDynamicIcon,
  ],
  templateUrl: './sales-chart.html',
  styleUrl: './sales-chart.scss',
})
export class SalesChartComponent {
  protected readonly icons = {
    ChartColumnIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    WarningIcon,
  };

  private readonly statisticsService = inject(StatisticsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currency = CURRENCY;

  readonly range = input.required<DateRange>();

  protected readonly points = signal<SalesPoint[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly showTable = signal(false);

  protected readonly isEmpty = computed(
    () => !this.points().some((point) => grossRevenueOf(point.details) > 0),
  );

  protected readonly bars = computed<SalesBar[]>(() => {
    const points = this.points();
    if (points.length === 0) return [];

    const peak = points.reduce((max, point) => Math.max(max, grossRevenueOf(point.details)), 0);

    return points.map((point) => {
      const grossRevenue = grossRevenueOf(point.details);
      return {
        date: point.date,
        details: point.details,
        grossRevenue,
        heightPx:
          peak === 0
            ? MIN_BAR_HEIGHT_PX
            : Math.max((grossRevenue / peak) * TRACK_HEIGHT_PX, MIN_BAR_HEIGHT_PX),
      };
    });
  });

  constructor() {
    effect((onCleanup) => {
      const sub = this.load(this.range());
      onCleanup(() => sub.unsubscribe());
    });
  }

  private load(range: DateRange): Subscription {
    this.loading.set(true);
    this.failed.set(false);
    return this.statisticsService
      .getSales(range, skipServerErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (points) => {
          this.points.set(points);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  protected toggleTable(): void {
    this.showTable.update((shown) => !shown);
  }
}
