import { Component, computed, DestroyRef, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CinefyFieldError,
  CinefyInput,
  CinefyLoadingSpinner,
  CinefyMediaImage,
} from 'cinefy-ui/components';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  QrCodeIcon,
  ScanLineIcon,
  TicketIcon,
} from '../../../shared/icons';
import { ALPHANUMERIC_PATTERN } from '../../../shared/validation';
import { BookingService } from '../../../services';
import { compareSeatPositions } from 'cinefy-ui/types';
import type { BookingConfirmation } from '../../../shared/types';

const AUTO_SUBMIT_DELAY_MS = 500;

@Component({
  selector: 'scan-ticket-modal',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    LucideDynamicIcon,
    CinefyInput,
    CinefyFieldError,
    CinefyLoadingSpinner,
    CinefyMediaImage,
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
  };

  private readonly bookingService = inject(BookingService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly referenceInput = viewChild(CinefyInput);

  readonly close = input<(() => void) | null>(null);

  protected readonly manualEntry = signal(false);

  protected readonly result = signal<BookingConfirmation | null>(null);

  protected readonly scanning = signal(false);

  protected readonly scanForm = new FormGroup({
    reference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(ALPHANUMERIC_PATTERN)],
    }),
  });

  private readonly referenceControl = this.scanForm.controls.reference;

  private autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;

  readonly modalTitle = computed(() => (this.result() ? 'Ticket info' : 'Scan ticket'));

  readonly modalDescription = computed(() => {
    if (this.result()) return 'Ticket verified and marked as used';
    return this.manualEntry()
      ? 'Type the booking reference below'
      : 'Scan the QR code on the ticket';
  });

  protected readonly experience = computed(() => {
    const result = this.result();
    if (!result) return '';
    return `${result.hallType}${result.is3D ? ' (3D)' : ''}`;
  });

  protected readonly seats = computed(() =>
    [...(this.result()?.seats ?? [])].sort((a, b) => compareSeatPositions(a.position, b.position)),
  );

  constructor() {
    this.referenceControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.scheduleAutoSubmit());

    this.destroyRef.onDestroy(() => this.clearAutoSubmit());
  }

  protected onManualEntryChange(checked: boolean): void {
    this.manualEntry.set(checked);
    this.clearReference();
    if (!checked) {
      this.clearAutoSubmit();
      this.focusInput();
    }
  }

  protected onInputBlur(): void {
    this.focusInput();
  }

  protected canSubmit(): boolean {
    return !this.referenceControl.invalid && !!this.referenceControl.value && !this.scanning();
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const reference = this.referenceControl.value;
    this.scanning.set(true);
    this.scanForm.disable({ emitEvent: false });

    this.bookingService
      .scanTicket(reference)
      .pipe(
        finalize(() => this.scanning.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (confirmation) => {
          this.scanForm.enable({ emitEvent: false });
          this.result.set(confirmation);
          this.clearReference();
        },
        error: () => {
          this.scanForm.enable({ emitEvent: false });
          this.clearReference();
          this.focusInput();
        },
      });
  }

  protected scanAgain(): void {
    this.result.set(null);
    this.clearReference();
    this.clearAutoSubmit();
    // The input is re-created when the result clears, so focus after it renders
    setTimeout(() => this.focusInput());
  }

  private clearReference(): void {
    this.referenceControl.reset('', { emitEvent: false });
  }

  private scheduleAutoSubmit(): void {
    if (this.manualEntry() || this.autoSubmitTimer !== null) return;

    this.autoSubmitTimer = setTimeout(() => {
      this.autoSubmitTimer = null;
      if (this.scanForm.invalid) return;
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
