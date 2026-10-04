import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefyInput, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { OAuthButtonsComponent, OtpStep } from '../../../components';
import { AuthFormStage, ApiError } from '../../../shared/types';
import { CinefyToastService } from 'cinefy-ui/services';
import { AuthService } from '../../../services';
import { skipErrorToast } from 'cinefy-ui/http';
import { EMAIL_PATTERN } from 'cinefy-ui/forms';
import { toSafeRedirect } from '../../../utils';
import { ArrowRightIcon, EmailIcon, LockIcon } from '../../../shared/icons';

@Component({
  selector: 'login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideDynamicIcon,
    CinefyInput,
    CinefyLoadingSpinner,
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
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stage = signal<AuthFormStage>('form');
  protected readonly submitting = signal(false);
  protected readonly connecting = signal(false);

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

  protected readonly authenticating = computed(() => this.submitting() || this.connecting());

  protected readonly verifyAccount = (code: string) => this.authService.verifyAccount({ code });

  constructor() {
    effect(() => {
      if (this.authenticating()) {
        this.loginForm.disable({ emitEvent: false });
      } else {
        this.loginForm.enable({ emitEvent: false });
      }
    });
  }

  protected onSubmit() {
    if (this.loginForm.invalid || this.authenticating()) return;

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
    return toSafeRedirect(this.route.snapshot.queryParamMap.get('redirectUrl'));
  }
}
