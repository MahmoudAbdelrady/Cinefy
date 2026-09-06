import { Component, computed, DestroyRef, inject, linkedSignal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CinefyDialog,
  CinefyDialogFooter,
  CinefyEmptyState,
  CinefyHoldTimer,
  CinefyLoadingSpinner,
  CinefyMediaImage,
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
import { brandChip } from '../../shared/payments';

@Component({
  selector: 'checkout-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    CinefyMediaImage,
    CinefyDialog,
    CinefyDialogFooter,
    CinefyHoldTimer,
    BookingCancelledComponent,
    CinefyEmptyState,
    CinefyLoadingSpinner,
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
  private readonly destroyRef = inject(DestroyRef);

  private readonly cancelDialog = viewChild('cancelDialog', { read: CinefyDialog });

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
  protected readonly cancelVisible = this.perBooking(false);
  protected readonly expiredVisible = this.perBooking(false);

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

  protected readonly totalPrice = computed(() => this.booking()?.totalPrice ?? 0);

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;

  protected readonly isSelected = (method: ClientPaymentMethod) => method.id === this.selectedId();

  protected readonly brandChip = brandChip;

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
        next: ({ url }) => {
          window.location.href = url;
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
        next: ({ url }) => {
          window.location.href = url;
        },
        error: () => {
          this.redirecting.set(false);
        },
      });
  }

  protected onExpired(): void {
    this.bookingExpired.set(true);
    this.expiredVisible.set(true);
  }

  protected goToSeatSelection(): void {
    const booking = this.booking();
    this.expiredVisible.set(false);
    if (!booking) return;

    this.router.navigateByUrl(`/movies/${booking.movie.id}/seats/${booking.showtimeId}`);
  }

  protected closeCancelDialog(): void {
    this.cancelDialog()?.close();
  }

  protected confirmCancel(): void {
    const booking = this.booking();
    if (!booking || this.cancelling()) return;

    this.cancelling.set(true);
    this.bookingService
      .cancelBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeCancelDialog();
          this.cancelled.set(true);
        },
        error: () => {
          this.cancelling.set(false);
        },
      });
  }
}
