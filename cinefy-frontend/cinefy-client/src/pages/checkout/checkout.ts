import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NgpDialogTrigger, NgpDialogManager } from 'ng-primitives/dialog';
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
import { SEAT_CATEGORY_LABEL } from 'cinefy-ui/types';
import type { ApiError } from '../../shared/types';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  MapPinIcon,
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
    CalendarIcon,
    ClapperboardIcon,
    ClockIcon,
    CreditCardIcon,
    LockIcon,
    MapPinIcon,
    TriangleAlertIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly destroyRef = inject(DestroyRef);

  private readonly expiredDialog = viewChild.required<TemplateRef<unknown>>('expiredDialog');

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

  protected readonly errorMessage = computed(() => {
    const error = this.bookingResource.error();
    const message = error instanceof HttpErrorResponse ? (error.error as ApiError)?.message : null;
    return message ?? 'Something went wrong. Please try again later.';
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
  protected readonly bookingExpired = signal(false);

  protected readonly timerExpiresAt = computed(() =>
    this.cancelled() ? undefined : this.booking()?.expiresAt,
  );

  protected readonly seatsSubtotal = computed(() =>
    (this.booking()?.seats ?? []).reduce((sum, seat) => sum + seat.price, 0),
  );

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;

  protected onExpired(): void {
    this.bookingExpired.set(true);
    this.dialogManager.open(this.expiredDialog() as TemplateRef<never>);
  }

  protected goToSeatSelection(close: () => void): void {
    const booking = this.booking();
    close();
    if (!booking) return;

    this.router.navigateByUrl(`/movies/${booking.movie.id}/seats/${booking.showtimeId}`);
  }

  protected confirmCancel(close: () => void): void {
    const booking = this.booking();
    if (!booking || this.cancelling()) return;

    this.cancelling.set(true);
    this.bookingService
      .cancelBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          close();
          this.cancelled.set(true);
        },
        error: () => {
          this.cancelling.set(false);
        },
      });
  }
}
