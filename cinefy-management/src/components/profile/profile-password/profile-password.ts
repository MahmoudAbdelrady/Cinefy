import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PasswordIcon, SaveIcon } from '../../../shared/icons';
import { InputField } from '../../input-field/input-field';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { PASSWORD_PATTERN } from '../../../shared/validation';

@Component({
  selector: 'profile-password',
  imports: [ReactiveFormsModule, LucideAngularModule, InputField, LoadingSpinnerComponent],
  templateUrl: './profile-password.html',
  styleUrl: './profile-password.scss',
})
export class ProfilePasswordComponent {
  protected readonly icons = {
    SaveIcon,
    KeyIcon: PasswordIcon,
  };

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

    // TODO(profile-backend): call the change-password endpoint (POST /staff/me/password)
    // with { currentPassword, newPassword } and on success clear `saving`, reset the form,
    // and toast. On error clear `saving` and toast err.error?.message. Use
    // takeUntilDestroyed(this.destroyRef) since the response fires a toast.
  }
}
