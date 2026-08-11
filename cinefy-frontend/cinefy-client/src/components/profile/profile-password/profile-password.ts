import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField, PasswordChecklist } from 'cinefy-ui/components';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { KeyRoundIcon, LockIcon } from '../../../shared/icons';
import { PASSWORD_PATTERN } from '../../../shared/validation';
import type { ChangePasswordPayload } from '../../../shared/types';

@Component({
  selector: 'profile-password',
  imports: [ReactiveFormsModule, InputField, PasswordChecklist],
  templateUrl: './profile-password.html',
  styleUrl: './profile-password.scss',
})
export class ProfilePasswordComponent {
  protected readonly icons = {
    LockIcon,
    KeyRoundIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

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
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    const payload: ChangePasswordPayload = {
      currentPassword,
      newPassword,
    };

    this.passwordForm.reset();
  }
}
