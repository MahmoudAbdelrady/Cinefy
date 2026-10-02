import { Component, computed, inject, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { CinefyDialog, CinefyErrorState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { compareSeatPositions } from 'cinefy-ui/types';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { BookingService } from '../../../services';
import type { PastBooking } from '../../../shared/types';

@Component({
  selector: 'past-booking-details-modal',
  imports: [CurrencyPipe, DatePipe, CinefyDialog, CinefyErrorState, CinefyLoadingSpinner],
  templateUrl: './past-booking-details-modal.html',
  styleUrl: './past-booking-details-modal.scss',
})
export class PastBookingDetailsModalComponent {
  private readonly bookingService = inject(BookingService);

  readonly booking = input.required<PastBooking>();

  readonly closed = output<void>();

  protected readonly details = rxResource({
    params: () => this.booking().id,
    stream: ({ params: bookingId }) =>
      this.bookingService.getPastBookingDetails(bookingId, skipServerErrorToast()),
  });

  protected readonly sortedSeats = computed(() =>
    [...(this.details.value()?.seats ?? [])].sort((a, b) =>
      compareSeatPositions(a.position, b.position),
    ),
  );
}
