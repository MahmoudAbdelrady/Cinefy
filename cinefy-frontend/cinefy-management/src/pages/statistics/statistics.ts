import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  DateRangeSelectorComponent,
  MoviePerformanceComponent,
  SalesChartComponent,
  SummaryCardsComponent,
} from '../../components';
import type { DateRange } from '../../shared/types';

@Component({
  selector: 'statistics-page',
  imports: [
    DateRangeSelectorComponent,
    SummaryCardsComponent,
    SalesChartComponent,
    MoviePerformanceComponent,
    DatePipe,
  ],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class StatisticsPage {
  protected readonly range = signal<DateRange | null>(null);

  protected onRangeChange(range: DateRange): void {
    this.range.set(range);
  }
}
