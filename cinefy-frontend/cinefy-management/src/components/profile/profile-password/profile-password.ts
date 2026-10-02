import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { KeyIcon } from '../../../shared/icons';
import { CinefyInput, CinefyLoadingSpinner, CinefyPasswordChecklist } from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { PASSWORD_PATTERN } from '../../../shared/validation';
import { StaffService } from '../../../services';
import type { ApiError } from '../../../shared/types';

@Component({
  selector: 'profile-password',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    CinefyInput,
    CinefyLoadingSpinner,
    CinefyPasswordChecklist,
  ],
  templateUrl: './profile-password.html',
  styleUrl: './profile-password.scss',
})
export class ProfilePasswordComponent {
  protected readonly icons = {
    KeyIcon,
  };

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(CinefyToastService);
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

    const value = this.passwordForm.getRawValue();
    this.saving.set(true);
    this.staffService
      .changeCurrentStaffMemberPassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      })
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
          if (err.status === 0 || err.status >= 500) {
            this.passwordForm.reset();
          }
        },
      });
  }
}
