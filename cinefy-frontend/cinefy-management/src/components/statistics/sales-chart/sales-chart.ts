import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { EmptyStateComponent, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ChartColumnIcon, WarningIcon } from '../../../shared/icons';
import { StatisticsService } from '../../../services';
import type { DateRange, SalesPoint, StatisticsPeriodTotals } from '../../../shared/types';

const CURRENCY = 'EGP';
const MIN_BAR_HEIGHT_PCT = 2;

interface SalesBar {
  date: string;
  details: StatisticsPeriodTotals;
  grossRevenue: number;
  heightPct: number;
}

function grossRevenueOf(details: StatisticsPeriodTotals): number {
  return details.netRevenue + details.refunded;
}

@Component({
  selector: 'sales-chart',
  imports: [LoadingSpinnerComponent, EmptyStateComponent, DecimalPipe, DatePipe],
  templateUrl: './sales-chart.html',
  styleUrl: './sales-chart.scss',
})
export class SalesChartComponent {
  protected readonly icons = {
    ChartColumnIcon,
    WarningIcon,
  };

  private readonly statisticsService = inject(StatisticsService);

  protected readonly currency = CURRENCY;

  readonly range = input.required<DateRange>();

  protected readonly points = signal<SalesPoint[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly hovered = signal<number | null>(null);
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
        heightPct:
          peak === 0
            ? MIN_BAR_HEIGHT_PCT
            : Math.max((grossRevenue / peak) * 100, MIN_BAR_HEIGHT_PCT),
      };
    });
  });

  constructor() {
    effect(() => this.load(this.range()));
  }

  private load(range: DateRange): void {
    this.loading.set(true);
    this.failed.set(false);
    this.hovered.set(null);
    this.statisticsService.getSales(range).subscribe({
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

  protected onBarEnter(index: number): void {
    this.hovered.set(index);
  }

  protected onBarLeave(): void {
    this.hovered.set(null);
  }
}
