import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  DEFAULT_COUNTRY,
  LoadingSpinnerComponent,
  PhoneInput,
  phoneNumberValidator,
  toE164Digits,
  type PhoneCountryCode,
} from 'cinefy-ui/components';
import { OAuthRegistration } from '../../../shared/types';
import { AuthService } from '../../../services';
import { ArrowRightIcon } from '../../../shared/icons';

@Component({
  selector: 'oauth-register-form',
  imports: [ReactiveFormsModule, LucideDynamicIcon, LoadingSpinnerComponent, PhoneInput],
  templateUrl: './oauth-register-form.html',
  styleUrl: './oauth-register-form.scss',
})
export class OAuthRegisterForm {
  protected readonly icons = {
    ArrowRightIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly registration = input.required<OAuthRegistration>();

  readonly completed = output<void>();

  protected readonly submitting = signal(false);

  protected readonly registerForm = new FormGroup({
    phoneCountry: new FormControl<PhoneCountryCode>(DEFAULT_COUNTRY, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.registerForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.registerForm.controls.phoneCountry),
    );
  }

  protected onSubmit() {
    if (this.registerForm.invalid || this.submitting()) return;

    const value = this.registerForm.getRawValue();
    this.submitting.set(true);

    this.authService
      .oAuthSignUp({
        registrationToken: this.registration().registrationToken,
        phoneNumber: toE164Digits(this.registerForm.controls.phoneCountry, value.phoneNumber),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.completed.emit(),
        error: () => this.submitting.set(false),
      });
  }
}
