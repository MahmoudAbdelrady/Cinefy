import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField, LoadingSpinnerComponent, PasswordChecklist } from 'cinefy-ui/components';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { ToastService } from 'cinefy-ui/services';
import { ClientService } from '../../../services';
import { KeyRoundIcon, LockIcon } from '../../../shared/icons';
import { PASSWORD_PATTERN } from '../../../shared/validation';
import type { ApiError, ChangePasswordPayload } from '../../../shared/types';

@Component({
  selector: 'profile-password',
  imports: [ReactiveFormsModule, InputField, PasswordChecklist, LoadingSpinnerComponent],
  templateUrl: './profile-password.html',
  styleUrl: './profile-password.scss',
})
export class ProfilePasswordComponent {
  protected readonly icons = {
    LockIcon,
    KeyRoundIcon,
  };

  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);

  protected readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
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
      this.passwordForm.controls.newPassword,
      this.passwordForm.controls.confirmPassword,
      this.destroyRef,
    );
  }

  protected save(): void {
    if (this.passwordForm.invalid || this.saving()) return;

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    const payload: ChangePasswordPayload = {
      currentPassword,
      newPassword,
    };

    this.saving.set(true);
    this.clientService
      .changeCurrentUserPassword(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.passwordForm.reset();
          this.toastService.success('Password changed');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const body = err.error as ApiError | null;
          if (body?.errorCode === 'PASSWORD_INCORRECT') {
            this.passwordForm.controls.currentPassword.reset();
          }
          if (body?.errorCode === 'PASSWORD_REUSED') {
            this.passwordForm.controls.newPassword.reset();
            this.passwordForm.controls.confirmPassword.reset();
          }
        },
      });
  }
}
