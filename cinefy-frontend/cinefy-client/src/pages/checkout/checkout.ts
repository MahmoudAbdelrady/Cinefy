import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { differenceInSeconds } from 'date-fns';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  InputField,
  LoadingSpinnerComponent,
  MediaImageComponent,
  ModalComponent,
} from 'cinefy-ui/components';
import { BookingService } from '../../services';
import { skipErrorToast } from '../../app/core/interceptors';
import {
  ArrowLeftIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../shared/icons';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
    ClockIcon,
    CreditCardIcon,
    LockIcon,
    TriangleAlertIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);

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
  protected readonly cancelled = signal(false);
  protected readonly secondsLeft = signal<number | null>(null);

  protected readonly expiring = computed(() => {
    const seconds = this.secondsLeft();
    return seconds !== null && seconds <= 60;
  });
  protected readonly countdown = computed(() => {
    const seconds = this.secondsLeft();
    return seconds === null ? null : formatCountdown(seconds);
  });

  protected readonly seatsSubtotal = computed(() =>
    (this.booking()?.seats ?? []).reduce((sum, seat) => sum + seat.price, 0),
  );

  protected readonly seatsLabel = computed(() =>
    (this.booking()?.seats ?? []).map((seat) => seat.position).join(' · '),
  );

  constructor() {
    effect((onCleanup) => {
      const expiresAt = this.booking()?.expiresAt;
      if (!expiresAt || this.cancelled()) return;

      const remaining = () => Math.max(0, differenceInSeconds(expiresAt, Date.now()));
      this.secondsLeft.set(remaining());
      if (this.secondsLeft() === 0) return;

      const id = setInterval(() => {
        this.secondsLeft.set(remaining());
        if (this.secondsLeft() === 0) clearInterval(id);
      }, 1000);
      onCleanup(() => clearInterval(id));
    });
  }

  protected confirmCancel(): void {
    this.cancelled.set(true);
  }
}
