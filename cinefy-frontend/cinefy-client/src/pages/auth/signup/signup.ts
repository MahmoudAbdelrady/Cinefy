import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  DEFAULT_COUNTRY,
  CinefyInput,
  PasswordChecklist,
  LoadingSpinnerComponent,
  PhoneInput,
  phoneNumberValidator,
  toE164Digits,
  type PhoneCountryCode,
} from 'cinefy-ui/components';
import { linkConfirmPassword } from 'cinefy-ui/forms';
import { OAuthButtonsComponent, OtpStep } from '../../../components';
import { AuthFormStage } from '../../../shared/types';
import { AuthService } from '../../../services';
import { EMAIL_PATTERN, NAME_PATTERN, PASSWORD_PATTERN } from '../../../shared/validation';
import { ArrowRightIcon, EmailIcon, LockIcon, UserIcon } from '../../../shared/icons';

@Component({
  selector: 'signup-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideDynamicIcon,
    CinefyInput,
    PasswordChecklist,
    PhoneInput,
    LoadingSpinnerComponent,
    OAuthButtonsComponent,
    OtpStep,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignUpPage {
  protected readonly icons = {
    UserIcon,
    EmailIcon,
    LockIcon,
    ArrowRightIcon,
  };

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stage = signal<AuthFormStage>('form');
  protected readonly submitting = signal(false);

  protected readonly signupForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    phoneCountry: new FormControl<PhoneCountryCode>(DEFAULT_COUNTRY, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PASSWORD_PATTERN)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly verifyAccount = (code: string) => this.authService.verifyAccount({ code });

  constructor() {
    this.signupForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.signupForm.controls.phoneCountry),
    );
    linkConfirmPassword(
      this.signupForm.controls.password,
      this.signupForm.controls.confirmPassword,
      this.destroyRef,
    );
  }

  protected onSubmit() {
    if (this.signupForm.invalid || this.submitting()) return;

    const value = this.signupForm.getRawValue();
    this.submitting.set(true);

    this.authService
      .signUp({
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phoneNumber: toE164Digits(this.signupForm.controls.phoneCountry, value.phoneNumber),
        password: value.password,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.stage.set('verify');
        },
        error: () => this.submitting.set(false),
      });
  }

  protected onVerified() {
    this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/');
  }
}
