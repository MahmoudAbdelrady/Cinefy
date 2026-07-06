import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  InputField,
  LoadingSpinnerComponent,
  MediaImageComponent,
  ModalComponent,
} from 'cinefy-ui/components';
import { BookingCancelledComponent, HoldTimerComponent } from '../../components';
import { BookingService } from '../../services';
import { skipErrorToast } from '../../app/core/interceptors';
import { SEAT_KIND_LABEL } from '../../shared/types';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  LockIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../shared/icons';

@Component({
  selector: 'checkout-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgpDialogTrigger,
    LucideDynamicIcon,
    InputField,
    MediaImageComponent,
    ModalComponent,
    HoldTimerComponent,
    BookingCancelledComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutPage {
  protected readonly icons = {
    ArrowLeftIcon,
    CreditCardIcon,
    LockIcon,
    TriangleAlertIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly bookingId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('bookingId'))),
  );

  protected readonly bookingResource = rxResource({
    params: () => this.bookingId() ?? undefined,
    stream: ({ params: bookingId }) =>
      this.bookingService.getActiveBookingDetails(bookingId, skipErrorToast()),
  });

  protected readonly booking = computed(() =>
    this.bookingResource.hasValue() ? this.bookingResource.value() : undefined,
  );

  protected readonly notFound = computed(() => {
    const error = this.bookingResource.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly paymentForm = new FormGroup({
    cardholder: new FormControl('', { nonNullable: true }),
    cardNumber: new FormControl('', { nonNullable: true }),
    expiry: new FormControl('', { nonNullable: true }),
    cvc: new FormControl('', { nonNullable: true }),
  });

  protected readonly processing = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly cancelled = signal(false);

  protected readonly timerExpiresAt = computed(() =>
    this.cancelled() ? undefined : this.booking()?.expiresAt,
  );

  protected readonly seatsSubtotal = computed(() =>
    (this.booking()?.seats ?? []).reduce((sum, seat) => sum + seat.price, 0),
  );

  protected readonly seatKindLabel = SEAT_KIND_LABEL;

  protected confirmCancel(close: () => void): void {
    const booking = this.booking();
    if (!booking || this.cancelling()) return;

    this.cancelling.set(true);
    this.bookingService
      .cancelBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelling.set(false);
          close();
          this.cancelled.set(true);
        },
        error: () => {
          this.cancelling.set(false);
        },
      });
  }
}
