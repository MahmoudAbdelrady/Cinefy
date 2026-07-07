import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { InfoIcon } from '../../../shared/icons';
import { BookingService } from '../../../services';
import {
  SEAT_KIND_LABEL,
  type BookedSeat,
  type BookingRequest,
  type Seat,
  type SeatCategory,
} from '../../../shared/types';

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
  protected readonly seatKindLabel = SEAT_KIND_LABEL;

  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly showtimeId = input.required<string>();
  readonly selectedSeats = input.required<Seat[]>();
  readonly prices = input.required<Record<SeatCategory, number>>();

  protected readonly submitting = signal(false);

  protected readonly seats = computed<BookedSeat[]>(() => {
    const prices = this.prices();
    return this.selectedSeats().map((seat) => {
      const category = seat.kind as SeatCategory;
      return { position: seat.id, category, price: prices[category] };
    });
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
