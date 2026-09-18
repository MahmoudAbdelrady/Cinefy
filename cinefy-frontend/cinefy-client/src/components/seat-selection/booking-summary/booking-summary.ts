import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefyLoadingSpinner } from 'cinefy-ui/components';
import { compareSeatPositions, SEAT_CATEGORY_LABEL, type Seat } from 'cinefy-ui/types';
import { InfoIcon } from '../../../shared/icons';
import { BookingService } from '../../../services';
import type { BookedSeat, BookingRequest, SelectableSeatCategory } from '../../../shared/types';

@Component({
  selector: 'booking-summary',
  imports: [LucideDynamicIcon, CurrencyPipe, CinefyLoadingSpinner],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.scss',
})
export class BookingSummaryComponent {
  protected readonly icons = {
    InfoIcon,
  };
  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;

  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly showtimeId = input.required<string>();
  readonly selectedSeats = input.required<Seat[]>();
  readonly prices = input.required<Record<SelectableSeatCategory, number>>();

  protected readonly submitting = signal(false);

  protected readonly seats = computed<BookedSeat[]>(() => {
    const prices = this.prices();
    return this.selectedSeats()
      .map((seat) => {
        const category = seat.category as SelectableSeatCategory;
        return { position: seat.id, category, price: prices[category] };
      })
      .sort((a, b) => compareSeatPositions(a.position, b.position));
  });

  protected readonly total = computed(() =>
    this.seats().reduce((sum, seat) => sum + seat.price, 0),
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
