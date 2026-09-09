import { Component, inject, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { CinefyDialog, CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { BookingService } from '../../../services';
import { TriangleAlertIcon } from '../../../shared/icons';
import type { PastBooking } from '../../../shared/types';

@Component({
  selector: 'past-booking-details-modal',
  imports: [CurrencyPipe, DatePipe, CinefyDialog, CinefyEmptyState, CinefyLoadingSpinner],
  templateUrl: './past-booking-details-modal.html',
  styleUrl: './past-booking-details-modal.scss',
})
export class PastBookingDetailsModalComponent {
  protected readonly icons = {
    TriangleAlertIcon,
  };

  private readonly bookingService = inject(BookingService);

  readonly booking = input.required<PastBooking>();

  readonly closed = output<void>();

  protected readonly details = rxResource({
    params: () => this.booking().id,
    stream: ({ params: bookingId }) => this.bookingService.getPastBookingDetails(bookingId),
  });
}
