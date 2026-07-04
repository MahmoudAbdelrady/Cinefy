import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { InfoIcon } from '../../../shared/icons';
import { BookingService } from '../../../services';
import {
  SEAT_KIND_LABEL,
  type BookingRequest,
  type Seat,
  type SeatCategory,
} from '../../../shared/types';

interface CategoryLine {
  category: SeatCategory;
  label: string;
  count: number;
  total: number;
}

const CATEGORY_ORDER: SeatCategory[] = ['NORMAL', 'VIP'];

@Component({
  selector: 'booking-summary',
  imports: [LucideDynamicIcon, CurrencyPipe, LoadingSpinnerComponent],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.scss',
})
export class BookingSummaryComponent {
  protected readonly icons = {
    InfoIcon,
  };

  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly showtimeId = input.required<string>();
  readonly selectedSeats = input.required<Seat[]>();
  readonly prices = input.required<Record<SeatCategory, number>>();

  protected readonly submitting = signal(false);

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

  protected proceedToPayment() {
    if (this.submitting()) return;

    const request: BookingRequest = {
      showtimeId: this.showtimeId(),
      seats: this.selectedSeats().map((seat) => seat.id),
    };
    const idempotencyKey = crypto.randomUUID();
    this.submitting.set(true);
    this.bookingService.createBooking(request, idempotencyKey).subscribe({
      next: (booking) => this.router.navigateByUrl(`/checkout/${booking.id}`),
      error: () => this.submitting.set(false),
    });
  }
}
