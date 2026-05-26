import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowRight, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { InputField } from '../../../components/input-field/input-field';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner';
import { AuthService, ToastService } from '../../../services';
import { AtSignIcon, PasswordIcon } from '../../../shared/icons';

@Component({
  selector: 'login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    NgpButton,
    InputField,
    LoadingSpinnerComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  protected readonly icons = {
    AtSignIcon,
    PasswordIcon,
    ArrowRightIcon: ArrowRight,
  };

  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);

  protected readonly loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
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
          this.toastService.error('Invalid username or password');
        },
      });
  }
}
