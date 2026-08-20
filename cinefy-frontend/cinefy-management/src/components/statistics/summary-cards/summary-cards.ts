import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { EmptyStateComponent, LoadingSpinnerComponent } from 'cinefy-ui/components';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  MinusIcon,
  WarningIcon,
} from '../../../shared/icons';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { StatisticsService } from '../../../services';
import type { DateRange, StatisticsSummary } from '../../../shared/types';

const CURRENCY = 'EGP';

type MetricDelta = { kind: 'none' } | { kind: 'flat' } | { kind: 'up' | 'down'; percent: number };

interface SummaryCard {
  key: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
  delta: MetricDelta;
  higherIsBetter: boolean;
}

@Component({
  selector: 'summary-cards',
  imports: [LucideDynamicIcon, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.scss',
})
export class SummaryCardsComponent {
  protected readonly icons = {
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    MinusIcon,
    WarningIcon,
  };

  private readonly statisticsService = inject(StatisticsService);

  readonly range = input.required<DateRange>();

  protected readonly summary = signal<StatisticsSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly comparisonLabel = computed(() => {
    const { from, to } = this.range();
    const length = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
    return length === 1 ? 'the day before' : `the ${length} days before`;
  });

  protected readonly cards = computed<SummaryCard[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    const { current, previous } = summary;
    const grossCurrent = current.netRevenue + current.refunded;
    const grossPrevious = previous.netRevenue + previous.refunded;
    const refundShare = grossCurrent === 0 ? 0 : current.refunded / grossCurrent;

    return [
      {
        key: 'gross',
        label: 'Total sales',
        value: formatMoney(grossCurrent),
        unit: CURRENCY,
        delta: computeDelta(grossCurrent, grossPrevious),
        higherIsBetter: true,
      },
      {
        key: 'net',
        label: 'Net revenue',
        value: formatMoney(current.netRevenue),
        unit: CURRENCY,
        note: 'Sales minus refunds',
        delta: computeDelta(current.netRevenue, previous.netRevenue),
        higherIsBetter: true,
      },
      {
        key: 'refunds',
        label: 'Refunded',
        value: formatMoney(current.refunded),
        unit: CURRENCY,
        note: `${formatPercent(refundShare)} of sales`,
        delta: computeDelta(current.refunded, previous.refunded),
        higherIsBetter: false,
      },
      {
        key: 'tickets',
        label: 'Tickets sold',
        value: formatCount(current.ticketsSold),
        delta: computeDelta(current.ticketsSold, previous.ticketsSold),
        higherIsBetter: true,
      },
      {
        key: 'occupancy',
        label: 'Occupancy',
        value: formatPercent(current.occupancy),
        delta: computeDelta(current.occupancy, previous.occupancy),
        higherIsBetter: true,
      },
    ];
  });

  constructor() {
    effect(() => this.load(this.range()));
  }

  private load(range: DateRange): void {
    this.loading.set(true);
    this.failed.set(false);
    this.statisticsService.getSummary(range).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}

function computeDelta(current: number, previous: number): MetricDelta {
  if (previous === 0) return current === 0 ? { kind: 'flat' } : { kind: 'none' };
  if (current === previous) return { kind: 'flat' };
  const change = (current - previous) / previous;
  return { kind: change > 0 ? 'up' : 'down', percent: Math.abs(change) * 100 };
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}
