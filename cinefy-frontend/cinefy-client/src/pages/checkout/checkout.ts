import {
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NgpDialogTrigger, NgpDialogManager } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  EmptyStateComponent,
  HoldTimerComponent,
  LoadingSpinnerComponent,
  MediaImageComponent,
  ModalComponent,
} from 'cinefy-ui/components';
import { BookingCancelledComponent } from '../../components';
import { BookingService, ClientService } from '../../services';
import { comparePositions } from '../../shared/seat-position';
import { skipErrorToast } from '../../app/core/interceptors';
import { SEAT_CATEGORY_LABEL } from 'cinefy-ui/types';
import type { ApiError, ClientPaymentMethod } from '../../shared/types';
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  ClapperboardIcon,
  ClockIcon,
  MapPinIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../shared/icons';

const SUBTYPE_CHIP: Record<string, string> = {
  mastercard: 'MC',
  visa: 'VISA',
  amex: 'AMEX',
  americanexpress: 'AMEX',
};

@Component({
  selector: 'checkout-page',
  imports: [
    RouterLink,
    NgpDialogTrigger,
    LucideDynamicIcon,
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
    ArrowUpRightIcon,
    CalendarIcon,
    CheckIcon,
    ClapperboardIcon,
    ClockIcon,
    MapPinIcon,
    TriangleAlertIcon,
    XIcon,
  };

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly clientService = inject(ClientService);
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

  private readonly perBooking = <T>(initial: T) =>
    linkedSignal({ source: this.bookingId, computation: () => initial });

  protected readonly processing = this.perBooking(false);
  protected readonly redirecting = this.perBooking(false);
  protected readonly cancelling = this.perBooking(false);
  protected readonly cancelled = this.perBooking(false);
  protected readonly bookingExpired = this.perBooking(false);

  private readonly paymentMethodsResource = rxResource({
    params: () => this.bookingId() ?? undefined,
    stream: () => this.clientService.getPaymentMethods(),
  });

  protected readonly savedMethods = computed(() => this.paymentMethodsResource.value() ?? []);
  protected readonly loadingMethods = computed(() => this.paymentMethodsResource.isLoading());
  protected readonly selectedId = this.perBooking('');

  protected readonly selectedMethod = computed(() =>
    this.savedMethods().find((method) => method.id === this.selectedId()),
  );

  protected readonly busy = computed(
    () => this.processing() || this.redirecting() || this.bookingExpired(),
  );

  protected readonly timerExpiresAt = computed(() =>
    this.cancelled() ? undefined : this.booking()?.expiresAt,
  );

  protected readonly seats = computed(() =>
    [...(this.booking()?.seats ?? [])].sort((a, b) => comparePositions(a.position, b.position)),
  );

  protected readonly seatsSubtotal = computed(() =>
    (this.booking()?.seats ?? []).reduce((sum, seat) => sum + seat.price, 0),
  );

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;

  protected readonly isSelected = (method: ClientPaymentMethod) => method.id === this.selectedId();

  protected readonly brandChip = (cardBrand: string) => {
    const key = cardBrand.toLowerCase().replace(/\s+/g, '');
    return SUBTYPE_CHIP[key] ?? cardBrand.slice(0, 4).toUpperCase();
  };

  protected selectMethod(method: ClientPaymentMethod): void {
    this.selectedId.set(method.id);
  }

  protected paySaved(): void {
    const booking = this.booking();
    const method = this.selectedMethod();
    if (!booking || !method || this.busy()) return;

    this.processing.set(true);
    this.bookingService
      .paySavedCard(booking.id, method.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ redirectionUrl }) => {
          window.location.href = redirectionUrl;
        },
        error: () => {
          this.processing.set(false);
        },
      });
  }

  protected payWithNewCard(): void {
    const booking = this.booking();
    if (!booking || this.busy()) return;

    this.redirecting.set(true);
    this.bookingService
      .payBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ redirectionUrl }) => {
          window.location.href = redirectionUrl;
        },
        error: () => {
          this.redirecting.set(false);
        },
      });
  }

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
