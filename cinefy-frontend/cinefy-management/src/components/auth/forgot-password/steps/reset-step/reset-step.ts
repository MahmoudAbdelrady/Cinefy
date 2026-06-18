import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpButton } from 'ng-primitives/button';
import { InputField, LoadingSpinnerComponent } from 'cinefy-ui/components';
import {
  AlertIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  PasswordIcon,
} from '../../../../../shared/icons';
import { PASSWORD_PATTERN } from '../../../../../shared/validation';
import type { ApiError } from '../../../../../shared/types';
import { AuthService } from '../../../../../services/auth';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!confirmPassword) return null;
  return newPassword === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'fp-reset-step',
  imports: [ReactiveFormsModule, LucideDynamicIcon, NgpButton, InputField, LoadingSpinnerComponent],
  templateUrl: './reset-step.html',
  styleUrl: './reset-step.scss',
})
export class ResetStep {
  protected readonly icons = {
    PasswordIcon,
    ArrowRightIcon,
    CircleCheckIcon,
    AlertIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly code = input.required<string>();

  readonly reset = output<void>();
  readonly requestNewCode = output<void>();

  protected readonly submitting = signal(false);
  protected readonly codeRejected = signal(false);

  protected readonly resetForm = new FormGroup(
    {
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PASSWORD_PATTERN)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatchValidator },
  );

  private readonly newPasswordValue = toSignal(this.resetForm.controls.newPassword.valueChanges, {
    initialValue: '',
  });
  private readonly formValid = toSignal(
    this.resetForm.statusChanges.pipe(map((status) => status === 'VALID')),
    { initialValue: this.resetForm.valid },
  );

  protected readonly checks = computed(() => {
    const pw = this.newPasswordValue();
    return [
      { ok: pw.length >= 8, label: 'At least 8 characters' },
      { ok: /[a-z]/.test(pw), label: 'One lowercase letter' },
      { ok: /[A-Z]/.test(pw), label: 'One uppercase letter' },
      { ok: /[0-9]/.test(pw), label: 'One number' },
      { ok: /[^A-Za-z0-9]/.test(pw), label: 'One special character' },
    ];
  });

  protected readonly canSubmit = computed(() => this.formValid() && !this.submitting());

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
          const body = err.error as ApiError | null;
          if (body?.errorCode === 'OTP_INVALID') this.codeRejected.set(true);
          if (body?.errorCode === 'PASSWORD_REUSED') this.resetForm.reset();
        },
      });
  }

  protected onRequestNewCode() {
    this.requestNewCode.emit();
  }
}
