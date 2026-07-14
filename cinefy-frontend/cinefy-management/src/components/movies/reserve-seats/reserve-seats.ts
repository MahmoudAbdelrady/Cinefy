import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CustomSelectComponent,
  EmptyStateComponent,
  InputField,
  LoadingSpinnerComponent,
  ModalComponent,
  SeatMapComponent,
} from 'cinefy-ui/components';
import { SEAT_CATEGORY_LABEL, type Seat, type SeatCategory } from 'cinefy-ui/types';
import { BookingService } from '../../../services';
import { CheckIcon, InfoIcon, TicketIcon, WarningIcon, XIcon } from '../../../shared/icons';
import type {
  PaymentType,
  ShowtimeHallLayout,
  ShowtimeSeatLayout,
  StaffBookingRequest,
} from '../../../shared/types';

interface PaymentTypeEntry {
  value: PaymentType;
  label: string;
}

const PAYMENT_TYPE_ENTRIES: PaymentTypeEntry[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
];

function seatCategory(id: string, layout: ShowtimeSeatLayout): SeatCategory {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(hallLayout: ShowtimeHallLayout): Seat[][] {
  const { numberOfRows, seatsPerRow, layout } = hallLayout;
  return Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const row = String.fromCharCode(65 + rowIdx);
    return Array.from({ length: seatsPerRow }, (_, colIdx) => {
      const number = colIdx + 1;
      const id = `${row}${number}`;
      return {
        id,
        row,
        number,
        category: seatCategory(id, layout),
        onSiteOnly: layout.onSiteOnly.includes(id),
        taken: layout.reserved.includes(id),
      };
    });
  });
}

@Component({
  selector: 'reserve-seats',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    NgpDialogTrigger,
    LucideDynamicIcon,
    SeatMapComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CustomSelectComponent,
    InputField,
    ModalComponent,
  ],
  templateUrl: './reserve-seats.html',
  styleUrl: './reserve-seats.scss',
})
export class ReserveSeatsComponent {
  protected readonly icons = {
    CheckIcon,
    InfoIcon,
    TicketIcon,
    WarningIcon,
    XIcon,
  };

  private readonly bookingService = inject(BookingService);

  protected readonly seatCategoryLabel = SEAT_CATEGORY_LABEL;
  protected readonly paymentTypeEntries = PAYMENT_TYPE_ENTRIES;

  readonly showtimeId = input.required<string>();
  readonly container = input<string | HTMLElement | null>(null);

  protected readonly selectedSeats = signal<Seat[]>([]);
  protected readonly stage = signal<'seats' | 'payment' | 'done'>('seats');

  protected readonly paymentForm = new FormGroup({
    paymentType: new FormControl<PaymentType | null>(null, {
      validators: [Validators.required],
    }),
    paidAmount: new FormControl<number | null>(null),
    paymentReference: new FormControl('', { nonNullable: true }),
  });

  private readonly seatSelectionResource = rxResource({
    params: () => this.showtimeId(),
    stream: ({ params: showtimeId }) => this.bookingService.getSeatSelection(showtimeId),
  });

  protected readonly loading = computed(() => this.seatSelectionResource.isLoading());
  protected readonly failed = computed(() => !!this.seatSelectionResource.error());
  protected readonly seatSelection = computed(() => this.seatSelectionResource.value());

  protected readonly hall = computed<Seat[][]>(() => {
    const layout = this.seatSelection()?.hallLayout;
    return layout ? buildHall(layout) : [];
  });

  private readonly prices = computed<Partial<Record<SeatCategory, number>>>(() => {
    const pricing = this.seatSelection()?.hallLayout.ticketPricing ?? [];
    return pricing.reduce<Partial<Record<SeatCategory, number>>>(
      (acc, { seatCategory, price }) => ({ ...acc, [seatCategory]: price }),
      {},
    );
  });

  protected readonly pricedSeats = computed(() =>
    this.selectedSeats()
      .map((seat) => ({ seat, price: this.prices()[seat.category] ?? 0 }))
      .sort((a, b) => a.seat.row.localeCompare(b.seat.row) || a.seat.number - b.seat.number),
  );

  protected readonly total = computed(() =>
    this.pricedSeats().reduce((sum, { price }) => sum + price, 0),
  );

  private readonly paidAmount = toSignal(this.paymentForm.controls.paidAmount.valueChanges);

  protected readonly change = computed(() => {
    const paid = this.paidAmount();
    if (paid === null || paid === undefined) return null;
    const due = this.total();
    return paid >= due ? paid - due : null;
  });

  protected readonly paymentTypeLabel = (entry: PaymentTypeEntry) => entry.label;
  protected readonly paymentTypeValue = (entry: PaymentTypeEntry) => entry.value;

  protected onSelectionChange(seats: Seat[]): void {
    this.selectedSeats.set(seats);
  }

  protected onBook(): void {
    // TODO: Call /booking API
    this.stage.set('payment');
  }

  protected onPaymentTypeChange(entry: PaymentTypeEntry): void {
    const { paymentType, paidAmount, paymentReference } = this.paymentForm.controls;
    const isCash = entry.value === 'CASH';

    paymentType.setValue(entry.value);

    paidAmount.reset(null);
    paymentReference.reset('');

    paidAmount.setValidators(isCash ? [Validators.required, Validators.min(this.total())] : []);
    paymentReference.setValidators(isCash ? [] : [Validators.required]);

    paidAmount.updateValueAndValidity();
    paymentReference.updateValueAndValidity();
  }

  protected completePayment(): void {
    const { paymentType, paidAmount, paymentReference } = this.paymentForm.getRawValue();
    if (!paymentType) return;

    const request: StaffBookingRequest = {
      showtimeId: this.showtimeId(),
      positions: this.pricedSeats().map(({ seat }) => seat.id),
      paymentType,
      ...(paymentType === 'CASH'
        ? { paidAmount: paidAmount ?? 0 }
        : { paymentReference: paymentReference.trim() }),
    };

    // TODO: Call backend

    this.stage.set('done');
  }

  protected startNewBooking(): void {
    this.selectedSeats.set([]);
    this.paymentForm.reset({ paymentType: null, paidAmount: null, paymentReference: '' });
    this.stage.set('seats');
    this.seatSelectionResource.reload();
  }

  protected cancelPayment(close: () => void): void {
    // TODO: Call backend for cancelling
    this.selectedSeats.set([]);
    this.paymentForm.reset({ paymentType: null, paidAmount: null, paymentReference: '' });
    this.stage.set('seats');
    this.seatSelectionResource.reload();
    close();
  }
}
