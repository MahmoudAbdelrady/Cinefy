import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefyErrorState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from '../../../shared/icons';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { StatisticsService } from '../../../services';
import { CURRENCY } from '../../../shared/types';
import type { DateRange, StatisticsSummary } from '../../../shared/types';

type MetricDelta = { kind: 'none' } | { kind: 'flat' } | { kind: 'up' | 'down'; percent: number };

interface SummaryCard {
  key: string;
  label: string;
  value: number;
  isPercentage?: boolean;
  unit?: string;
  note?: string;
  delta: MetricDelta;
  higherIsBetter: boolean;
}

function computeDelta(current: number, previous: number): MetricDelta {
  if (previous === 0) return current === 0 ? { kind: 'flat' } : { kind: 'none' };
  if (current === previous) return { kind: 'flat' };
  const change = (current - previous) / previous;
  return { kind: change > 0 ? 'up' : 'down', percent: Math.abs(change) * 100 };
}

@Component({
  selector: 'summary-cards',
  imports: [LucideDynamicIcon, CinefyLoadingSpinner, CinefyErrorState, DecimalPipe],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.scss',
})
export class SummaryCardsComponent {
  protected readonly icons = {
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    MinusIcon,
  };

  private readonly statisticsService = inject(StatisticsService);
  private readonly destroyRef = inject(DestroyRef);

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

    return [
      {
        key: 'gross',
        label: 'Total sales',
        value: grossCurrent,
        unit: CURRENCY,
        delta: computeDelta(grossCurrent, grossPrevious),
        higherIsBetter: true,
      },
      {
        key: 'net',
        label: 'Net revenue',
        value: current.netRevenue,
        unit: CURRENCY,
        delta: computeDelta(current.netRevenue, previous.netRevenue),
        higherIsBetter: true,
      },
      {
        key: 'refunds',
        label: 'Refunded',
        value: current.refunded,
        unit: CURRENCY,
        delta: computeDelta(current.refunded, previous.refunded),
        higherIsBetter: false,
      },
      {
        key: 'tickets',
        label: 'Tickets sold',
        value: current.ticketsSold,
        delta: computeDelta(current.ticketsSold, previous.ticketsSold),
        higherIsBetter: true,
      },
      {
        key: 'occupancy',
        label: 'Occupancy',
        value: current.occupancy,
        isPercentage: true,
        delta: computeDelta(current.occupancy, previous.occupancy),
        higherIsBetter: true,
      },
    ];
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
      .getSummary(range, skipServerErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
