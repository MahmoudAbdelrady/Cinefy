import { Component, computed, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField } from 'cinefy-ui/components';
import { PASSWORD_PATTERN } from '../../../../../shared/validation';
import {
  ArrowRightIcon,
  CircleCheckIcon,
  LockIcon,
  TriangleAlertIcon,
} from '../../../../../shared/icons';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return !confirmPassword || newPassword === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'fp-reset-step',
  imports: [ReactiveFormsModule, LucideDynamicIcon, InputField],
  templateUrl: './reset-step.html',
  styleUrl: './reset-step.scss',
})
export class ResetStep {
  protected readonly icons = {
    LockIcon,
    ArrowRightIcon,
    CircleCheckIcon,
    TriangleAlertIcon,
  };

  readonly reset = output<void>();

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

  protected onSubmit() {
    if (this.resetForm.invalid) return;
    this.reset.emit();
  }
}
