import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputFieldV2, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { AuthService } from '../../../services';
import { EMAIL_PATTERN } from '../../../shared/validation';
import { ArrowRightIcon, EmailIcon, PasswordIcon } from '../../../shared/icons';

@Component({
  selector: 'login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideDynamicIcon,
    InputFieldV2,
    LoadingSpinnerComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  protected readonly icons = {
    EmailIcon,
    PasswordIcon,
    ArrowRightIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

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

  protected onSubmit() {
    if (this.loginForm.invalid || this.submitting()) return;
    this.submitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: () => {
          this.submitting.set(false);
          this.loginForm.controls.password.reset();
          this.toastService.error('Invalid email or password');
        },
      });
  }
}
