import { Component, computed, DestroyRef, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField, MediaImageComponent, ModalComponent } from 'cinefy-ui/components';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  QrCodeIcon,
  ScanLineIcon,
  TicketIcon,
  XIcon,
} from '../../../shared/icons';
import { NO_WHITESPACE_PATTERN } from '../../../shared/validation';

interface ScannedTicket {
  bookingReference: string;
  movieTitle: string;
  posterUrl?: string;
  hallName: string;
  hallType: string;
  is3D: boolean;
  startDateTime: string;
  seats: string[];
}

type ScanResult =
  | { status: 'VALID'; ticket: ScannedTicket }
  | { status: 'INVALID'; bookingReference: string };

const AUTO_SUBMIT_DELAY_MS = 500;

@Component({
  selector: 'scan-ticket-modal',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    LucideDynamicIcon,
    InputField,
    ModalComponent,
    MediaImageComponent,
  ],
  templateUrl: './scan-ticket-modal.html',
  styleUrl: './scan-ticket-modal.scss',
})
export class ScanTicketModalComponent {
  protected readonly icons = {
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    QrCodeIcon,
    ScanLineIcon,
    TicketIcon,
    XIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  private readonly referenceInput = viewChild(InputField);

  readonly close = input.required<() => void>();

  protected readonly manualEntry = signal(false);

  protected readonly result = signal<ScanResult | null>(null);

  protected readonly scanForm = new FormGroup({
    reference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
    }),
  });

  private readonly referenceControl = this.scanForm.controls.reference;

  private autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly modalTitle = computed(() => {
    const result = this.result();
    if (!result) return 'Scan Ticket';
    return result.status === 'VALID' ? 'Valid Ticket' : 'Invalid Ticket';
  });

  protected readonly modalDescription = computed(() => {
    const result = this.result();
    if (result?.status === 'VALID') return 'This booking is confirmed';
    if (result?.status === 'INVALID') return 'No confirmed booking matches this reference';
    return this.manualEntry()
      ? 'Type the booking reference below'
      : 'Scan the QR code on the ticket';
  });

  protected readonly experience = computed(() => {
    const result = this.result();
    if (result?.status !== 'VALID') return '';
    return `${result.ticket.hallType}${result.ticket.is3D ? ' (3D)' : ''}`;
  });

  constructor() {
    this.referenceControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.scheduleAutoSubmit());

    this.destroyRef.onDestroy(() => this.clearAutoSubmit());
  }

  protected onManualEntryChange(checked: boolean): void {
    this.manualEntry.set(checked);
    if (!checked) {
      this.referenceControl.setValue('', { emitEvent: false });
      this.clearAutoSubmit();
      this.focusInput();
    }
  }

  protected onInputBlur(): void {
    if (!this.manualEntry() && !this.result()) {
      this.focusInput();
    }
  }

  protected submit(): void {
    if (this.referenceControl.invalid) return;

    const reference = this.referenceControl.value.toUpperCase();

    // TODO: verify the booking reference against the backend
    if (reference.toLowerCase() === 'test2') {
      this.result.set({ status: 'INVALID', bookingReference: reference });
    } else {
      this.result.set({
        status: 'VALID',
        ticket: {
          bookingReference: reference,
          movieTitle: 'Spider-Man: No Way Home',
          hallName: 'Hall 1',
          hallType: 'IMAX',
          is3D: true,
          startDateTime: '2026-08-08T18:00:00',
          seats: ['E4', 'E5'],
        },
      });
    }

    this.referenceControl.setValue('', { emitEvent: false });
  }

  protected scanAgain(): void {
    this.result.set(null);
    this.referenceControl.setValue('', { emitEvent: false });
    this.clearAutoSubmit();
    // The input is re-created when the result clears, so focus after it renders
    setTimeout(() => this.focusInput());
  }

  private scheduleAutoSubmit(): void {
    if (this.manualEntry() || this.autoSubmitTimer !== null) return;

    this.autoSubmitTimer = setTimeout(() => {
      this.autoSubmitTimer = null;
      this.submit();
    }, AUTO_SUBMIT_DELAY_MS);
  }

  private clearAutoSubmit(): void {
    if (this.autoSubmitTimer !== null) {
      clearTimeout(this.autoSubmitTimer);
      this.autoSubmitTimer = null;
    }
  }

  private focusInput(): void {
    this.referenceInput()?.focus();
  }
}
