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
import { BookingService } from '../../services';
import { comparePositions } from '../../shared/seat-position';
import { skipErrorToast } from '../../app/core/interceptors';
import { SEAT_CATEGORY_LABEL } from 'cinefy-ui/types';
import type { ApiError } from '../../shared/types';
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

interface SavedPaymentMethod {
  id: string;
  maskedPan: string;
  cardSubtype: string;
}

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

  protected readonly processing = signal(false);
  protected readonly redirecting = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly cancelled = signal(false);
  protected readonly bookingExpired = signal(false);

  // TODO: load from the saved-cards endpoint once the backend exposes it.
  protected readonly savedMethods = signal<SavedPaymentMethod[]>([
    {
      id: 'uuias8asf4ascijwq-askascn',
      maskedPan: 'xxxx-xxxx-xxxx-0008',
      cardSubtype: 'MasterCard',
    },
    {
      id: 'asfqwqwf-8qw9848',
      maskedPan: 'xxxx-xxxx-xxxx-1234',
      cardSubtype: 'Visa',
    },
  ]);
  protected readonly selectedId = signal('');

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

  protected readonly isSelected = (method: SavedPaymentMethod) => method.id === this.selectedId();

  protected readonly subtypeChip = (cardSubtype: string) => {
    const key = cardSubtype.toLowerCase().replace(/\s+/g, '');
    return SUBTYPE_CHIP[key] ?? cardSubtype.slice(0, 4).toUpperCase();
  };

  protected selectMethod(method: SavedPaymentMethod): void {
    this.selectedId.set(method.id);
  }

  protected paySaved(): void {
    if (this.busy() || !this.selectedMethod()) return;

    this.processing.set(true);
    // TODO: charge the selected saved card once the endpoint exists.
  }

  protected payWithNewCard(): void {
    const booking = this.booking();
    if (!booking || this.busy()) return;

    this.redirecting.set(true);
    this.bookingService
      .payBooking(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ checkoutUrl }) => {
          window.location.href = checkoutUrl;
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
