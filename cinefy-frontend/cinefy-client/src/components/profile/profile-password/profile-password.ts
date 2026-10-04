import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CinefyInput, CinefyLoadingSpinner, CinefyPasswordChecklist } from 'cinefy-ui/components';
import { linkConfirmPassword, PASSWORD_PATTERN } from 'cinefy-ui/forms';
import { CinefyToastService } from 'cinefy-ui/services';
import { ClientService } from '../../../services';
import { KeyRoundIcon, LockIcon } from '../../../shared/icons';
import type { ApiError, ChangePasswordPayload } from '../../../shared/types';

@Component({
  selector: 'profile-password',
  imports: [ReactiveFormsModule, CinefyInput, CinefyPasswordChecklist, CinefyLoadingSpinner],
  templateUrl: './profile-password.html',
  styleUrl: './profile-password.scss',
})
export class ProfilePasswordComponent {
  protected readonly icons = {
    LockIcon,
    KeyRoundIcon,
  };

  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);

  private readonly currentUser = toSignal(this.clientService.getCurrentUser());
  protected readonly hasPassword = computed(() => this.currentUser()?.hasPassword ?? true);

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

    effect(() => {
      const currentPassword = this.passwordForm.controls.currentPassword;
      currentPassword.setValidators(this.hasPassword() ? [Validators.required] : []);
      currentPassword.updateValueAndValidity();
    });

    effect(() => {
      if (this.saving()) {
        this.passwordForm.disable({ emitEvent: false });
      } else {
        this.passwordForm.enable({ emitEvent: false });
      }
    });
  }

  protected save(): void {
    if (this.passwordForm.invalid || this.saving()) return;

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    const hadPassword = this.hasPassword();
    const payload: ChangePasswordPayload = hadPassword
      ? { currentPassword, newPassword }
      : { newPassword };

    this.saving.set(true);
    this.clientService
      .changeCurrentUserPassword(payload)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.toastService.success(hadPassword ? 'Password changed' : 'Password set');
        },
        error: (err: HttpErrorResponse) => {
          const body = err.error as ApiError | null;
          if (body?.errorCode === 'PASSWORD_INCORRECT') {
            this.passwordForm.controls.currentPassword.reset();
          }
          if (body?.errorCode === 'PASSWORD_REUSED') {
            this.passwordForm.controls.newPassword.reset();
            this.passwordForm.controls.confirmPassword.reset();
          }
          if (err.status === 0 || err.status >= 500) {
            this.passwordForm.reset();
          }
        },
      });
  }
}
