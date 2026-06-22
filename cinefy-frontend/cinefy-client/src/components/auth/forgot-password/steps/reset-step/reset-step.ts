import { Component, DestroyRef, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField, PasswordChecklist } from 'cinefy-ui/components';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { PASSWORD_PATTERN } from '../../../../../shared/validation';
import { ArrowRightIcon, LockIcon } from '../../../../../shared/icons';

@Component({
  selector: 'fp-reset-step',
  imports: [ReactiveFormsModule, LucideDynamicIcon, InputField, PasswordChecklist],
  templateUrl: './reset-step.html',
  styleUrl: './reset-step.scss',
})
export class ResetStep {
  protected readonly icons = {
    LockIcon,
    ArrowRightIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  readonly reset = output<void>();

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
    if (this.resetForm.invalid) return;
    this.reset.emit();
  }
}
