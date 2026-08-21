import { Component, signal } from '@angular/core';
import {
  DateRangeSelectorComponent,
  SalesChartComponent,
  SummaryCardsComponent,
} from '../../components';
import type { DateRange } from '../../shared/types';

@Component({
  selector: 'statistics-page',
  imports: [DateRangeSelectorComponent, SummaryCardsComponent, SalesChartComponent],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class StatisticsPage {
  protected readonly range = signal<DateRange | null>(null);

  protected onRangeChange(range: DateRange): void {
    this.range.set(range);
  }
}
