import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputFieldV2, LoadingSpinnerComponent, PasswordChecklist } from 'cinefy-ui/components';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { ArrowRightIcon, PasswordIcon } from '../../../../../shared/icons';
import { PASSWORD_PATTERN } from '../../../../../shared/validation';
import type { ApiError } from '../../../../../shared/types';
import { AuthService } from '../../../../../services/auth';

@Component({
  selector: 'fp-reset-step',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    InputFieldV2,
    LoadingSpinnerComponent,
    PasswordChecklist,
  ],
  templateUrl: './reset-step.html',
  styleUrl: './reset-step.scss',
})
export class ResetStep {
  protected readonly icons = {
    PasswordIcon,
    ArrowRightIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly code = input.required<string>();

  readonly reset = output<void>();
  readonly requestNewCode = output<void>();

  protected readonly submitting = signal(false);
  protected readonly codeRejected = signal(false);

  protected readonly resetForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PASSWORD_PATTERN)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly formValid = toSignal(
    this.resetForm.statusChanges.pipe(map((status) => status === 'VALID')),
    { initialValue: this.resetForm.valid },
  );

  protected readonly canSubmit = computed(() => this.formValid() && !this.submitting());

  constructor() {
    linkConfirmPassword(
      this.resetForm.controls.newPassword,
      this.resetForm.controls.confirmPassword,
      this.destroyRef,
    );
  }

  protected onSubmit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.authService
      .resetPassword({ code: this.code(), newPassword: this.resetForm.controls.newPassword.value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.reset.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const errorResponse = err.error as ApiError | null;
          if (errorResponse?.errorCode === 'OTP_INVALID') this.codeRejected.set(true);
          if (errorResponse?.errorCode === 'PASSWORD_REUSED') this.resetForm.reset();
        },
      });
  }

  protected onRequestNewCode() {
    this.requestNewCode.emit();
  }
}
