import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField, PasswordChecklist, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { PASSWORD_PATTERN } from '../../../../../shared/validation';
import type { ApiError } from '../../../../../shared/types';
import { AuthService } from '../../../../../services';
import { ArrowRightIcon, LockIcon, TriangleAlertIcon } from '../../../../../shared/icons';

@Component({
  selector: 'fp-reset-step',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    InputField,
    PasswordChecklist,
    LoadingSpinnerComponent,
  ],
  templateUrl: './reset-step.html',
  styleUrl: './reset-step.scss',
})
export class ResetStep {
  protected readonly icons = {
    LockIcon,
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

  constructor() {
    linkConfirmPassword(
      this.resetForm.controls.newPassword,
      this.resetForm.controls.confirmPassword,
      this.destroyRef,
    );
  }

  protected onSubmit() {
    if (this.resetForm.invalid || this.submitting()) return;
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
