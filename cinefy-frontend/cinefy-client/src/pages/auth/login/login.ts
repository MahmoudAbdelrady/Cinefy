import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { OAuthButtonsComponent, OtpStep } from '../../../components';
import { AuthFormStage, ApiError } from '../../../shared/types';
import { ToastService } from 'cinefy-ui/services';
import { AuthService } from '../../../services';
import { skipErrorToast } from '../../../app/core/interceptors';
import { EMAIL_PATTERN } from '../../../shared/validation';
import { ArrowRightIcon, EmailIcon, LockIcon } from '../../../shared/icons';

@Component({
  selector: 'login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideDynamicIcon,
    InputField,
    LoadingSpinnerComponent,
    OAuthButtonsComponent,
    OtpStep,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  protected readonly icons = {
    EmailIcon,
    LockIcon,
    ArrowRightIcon,
  };

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly otpStep = viewChild(OtpStep);

  protected readonly stage = signal<AuthFormStage>('form');
  protected readonly submitting = signal(false);
  protected readonly verifying = signal(false);
  protected readonly resending = signal(false);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected onSubmit() {
    if (this.loginForm.invalid || this.submitting()) return;

    const value = this.loginForm.getRawValue();
    this.submitting.set(true);

    this.authService
      .login({ email: value.email, password: value.password }, skipErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          const errorCode = (error.error as ApiError | null)?.errorCode;
          if (errorCode === 'ACCOUNT_NOT_VERIFIED') {
            this.stage.set('verify');
            return;
          }
          this.loginForm.controls.password.reset();
          this.toastService.error('Invalid email or password');
        },
      });
  }

  protected onVerified(code: string) {
    if (this.verifying()) return;
    this.verifying.set(true);

    this.authService
      .verifyAccount({ code })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: () => this.verifying.set(false),
      });
  }

  protected onResend() {
    if (this.resending()) return;
    this.resending.set(true);

    this.authService
      .sendOtp({ email: this.loginForm.controls.email.value, otpType: 'EMAIL_VERIFICATION' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.otpStep()?.startResendCooldown();
        },
        error: () => this.resending.set(false),
      });
  }
}
