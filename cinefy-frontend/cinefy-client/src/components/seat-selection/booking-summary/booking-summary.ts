import { Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { InfoIcon } from '../../../shared/icons';
import { SEAT_KIND_LABEL, type Seat, type SeatCategory } from '../../../shared/types';

interface CategoryLine {
  category: SeatCategory;
  label: string;
  count: number;
  total: number;
}

const CATEGORY_ORDER: SeatCategory[] = ['NORMAL', 'VIP'];

@Component({
  selector: 'booking-summary',
  imports: [LucideDynamicIcon, CurrencyPipe],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.scss',
})
export class BookingSummaryComponent {
  protected readonly icons = {
    InfoIcon,
  };

  readonly selectedSeats = input.required<Seat[]>();
  readonly prices = input.required<Record<SeatCategory, number>>();

  readonly proceed = output<void>();

  protected readonly lines = computed<CategoryLine[]>(() => {
    const prices = this.prices();
    const counts = new Map<SeatCategory, number>();
    for (const seat of this.selectedSeats()) {
      if (seat.kind === 'NORMAL' || seat.kind === 'VIP') {
        counts.set(seat.kind, (counts.get(seat.kind) ?? 0) + 1);
      }
    }
    return CATEGORY_ORDER.filter((category) => counts.has(category)).map((category) => {
      const count = counts.get(category)!;
      return { category, label: SEAT_KIND_LABEL[category], count, total: count * prices[category] };
    });
  });

  protected readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.total, 0),
  );
}
