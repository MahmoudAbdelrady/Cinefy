import { Component, computed, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ArrowRight, CircleAlert, CircleCheck, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { InputField } from '../../../../input-field/input-field';
import { LoadingSpinnerComponent } from '../../../../loading-spinner/loading-spinner';
import { PasswordIcon } from '../../../../../shared/icons';
import { PASSWORD_PATTERN } from '../../../../../shared/validation';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!confirmPassword) return null;
  return newPassword === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'fp-reset-step',
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    NgpButton,
    InputField,
    LoadingSpinnerComponent,
  ],
  templateUrl: './reset-step.html',
  styleUrl: './reset-step.scss',
})
export class ResetStep {
  protected readonly icons = {
    PasswordIcon,
    ArrowRightIcon: ArrowRight,
    CheckIcon: CircleCheck,
    AlertIcon: CircleAlert,
  };

  readonly reset = output<void>();

  protected readonly submitting = signal(false);

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
    setTimeout(() => {
      this.submitting.set(false);
      this.reset.emit();
    }, 1200);
  }
}
