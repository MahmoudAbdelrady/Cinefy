import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { KeyIcon, SaveIcon } from '../../../shared/icons';
import { InputField } from '../../input-field/input-field';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { PASSWORD_PATTERN } from '../../../shared/validation';
import { StaffService, ToastService } from '../../../services';
import type { ApiError } from '../../../shared/types';

@Component({
  selector: 'profile-password',
  imports: [ReactiveFormsModule, LucideAngularModule, InputField, LoadingSpinnerComponent],
  templateUrl: './profile-password.html',
  styleUrl: './profile-password.scss',
})
export class ProfilePasswordComponent {
  protected readonly icons = {
    SaveIcon,
    KeyIcon,
  };

  private readonly staffService = inject(StaffService);
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
    this.passwordForm.controls.confirmPassword.addValidators((control) => {
      const confirm = control.value;
      const next = this.passwordForm.controls.newPassword.value;
      if (!confirm || !next) return null;
      return confirm === next ? null : { mismatch: true };
    });
    this.passwordForm.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.passwordForm.controls.confirmPassword.updateValueAndValidity());
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
          this.toastService.error(body?.message ?? 'Failed to change password');
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
