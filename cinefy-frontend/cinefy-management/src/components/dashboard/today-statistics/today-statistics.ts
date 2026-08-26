import { Component } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CURRENCY } from '../../../shared/types';
import type { StatisticsPeriodTotals } from '../../../shared/types';

interface TodayFigure {
  key: string;
  label: string;
  value: number;
  unit?: string;
  isPercentage?: boolean;
  negative?: boolean;
}

const TODAY_TOTALS: StatisticsPeriodTotals = {
  netRevenue: 48150,
  refunded: 1240,
  ticketsSold: 342,
  occupancy: 84,
};

const TODAY_FIGURES: TodayFigure[] = [
  { key: 'net', label: 'Net revenue', value: TODAY_TOTALS.netRevenue, unit: CURRENCY },
  {
    key: 'refunded',
    label: 'Refunded',
    value: TODAY_TOTALS.refunded,
    unit: CURRENCY,
    negative: true,
  },
  { key: 'tickets', label: 'Tickets sold', value: TODAY_TOTALS.ticketsSold },
  { key: 'occupancy', label: 'Occupancy', value: TODAY_TOTALS.occupancy, isPercentage: true },
];

@Component({
  selector: 'today-statistics',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './today-statistics.html',
  styleUrl: './today-statistics.scss',
})
export class TodayStatisticsComponent {
  protected readonly figures = TODAY_FIGURES;

  protected readonly today = new Date();
}
