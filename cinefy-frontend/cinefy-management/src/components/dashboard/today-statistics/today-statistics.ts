import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CinefyLoadingSpinner } from 'cinefy-ui/components';
import { format } from 'date-fns';
import { StatisticsService } from '../../../services';
import { DATE_FORMAT } from '../../../shared/constants';
import { CURRENCY } from '../../../shared/types';
import type { StatisticsPeriodTotals } from '../../../shared/types';

interface TodayFigure {
  key: string;
  label: string;
  value: number;
  unit?: string;
  isPercentage?: boolean;
}

@Component({
  selector: 'today-statistics',
  imports: [DatePipe, DecimalPipe, CinefyLoadingSpinner],
  templateUrl: './today-statistics.html',
  styleUrl: './today-statistics.scss',
})
export class TodayStatisticsComponent {
  private readonly statisticsService = inject(StatisticsService);

  protected readonly totals = signal<StatisticsPeriodTotals | null>(null);
  protected readonly loading = signal(true);

  protected readonly today = new Date();

  protected readonly figures = computed<TodayFigure[]>(() => {
    const totals = this.totals();
    if (!totals) return [];

    return [
      { key: 'net', label: 'Net revenue', value: totals.netRevenue, unit: CURRENCY },
      { key: 'refunded', label: 'Refunded', value: totals.refunded, unit: CURRENCY },
      { key: 'tickets', label: 'Tickets sold', value: totals.ticketsSold },
      { key: 'occupancy', label: 'Occupancy', value: totals.occupancy, isPercentage: true },
    ];
  });

  constructor() {
    afterNextRender(() => this.load());
  }

  private load(): void {
    const today = format(this.today, DATE_FORMAT);
    this.statisticsService.getSales({ from: today, to: today }).subscribe({
      next: (points) => {
        this.totals.set(points[0]?.details ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
