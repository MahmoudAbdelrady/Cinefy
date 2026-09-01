import { Component, computed, DestroyRef, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefyInput, MediaImageComponent } from 'cinefy-ui/components';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  QrCodeIcon,
  ScanLineIcon,
  TicketIcon,
} from '../../../shared/icons';
import { NO_WHITESPACE_PATTERN } from '../../../shared/validation';
import { BookingService } from '../../../services';
import { comparePositions } from '../../halls/seat-layout';
import type { BookingConfirmation } from '../../../shared/types';

const AUTO_SUBMIT_DELAY_MS = 500;

@Component({
  selector: 'scan-ticket-modal',
  imports: [DatePipe, ReactiveFormsModule, LucideDynamicIcon, CinefyInput, MediaImageComponent],
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
      validators: [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
    }),
  });

  private readonly referenceControl = this.scanForm.controls.reference;

  private autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;

  readonly modalTitle = computed(() => (this.result() ? 'Ticket Info' : 'Scan Ticket'));

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
    [...(this.result()?.seats ?? [])].sort((a, b) => comparePositions(a.position, b.position)),
  );

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
    if (this.referenceControl.invalid || this.scanning()) return;

    const reference = this.referenceControl.value.toUpperCase();
    this.scanning.set(true);

    this.bookingService
      .scanTicket(reference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (confirmation) => {
          this.scanning.set(false);
          this.result.set(confirmation);
          this.referenceControl.setValue('', { emitEvent: false });
        },
        error: () => {
          this.scanning.set(false);
          this.referenceControl.setValue('', { emitEvent: false });
          this.focusInput();
        },
      });
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
