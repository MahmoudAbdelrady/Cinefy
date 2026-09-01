import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputFieldV2, LoadingSpinnerComponent } from 'cinefy-ui/components';
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
    InputFieldV2,
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
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stage = signal<AuthFormStage>('form');
  protected readonly submitting = signal(false);

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

  protected readonly verifyAccount = (code: string) => this.authService.verifyAccount({ code });

  protected onSubmit() {
    if (this.loginForm.invalid || this.submitting()) return;

    const value = this.loginForm.getRawValue();
    this.submitting.set(true);

    this.authService
      .login({ email: value.email, password: value.password }, skipErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl(this.redirectUrl()),
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          const errorResponse = error.error as ApiError | null;
          if (errorResponse?.errorCode === 'ACCOUNT_NOT_VERIFIED') {
            this.stage.set('verify');
            return;
          }
          this.loginForm.controls.password.reset();
          this.toastService.error(errorResponse?.message ?? 'Invalid email or password');
        },
      });
  }

  protected onVerified() {
    this.router.navigateByUrl(this.redirectUrl());
  }

  private redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/';
  }
}
