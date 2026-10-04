import { Component, DestroyRef, effect, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefyInput, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { EMAIL_PATTERN } from 'cinefy-ui/forms';
import { AuthService } from '../../../../../services';
import { ArrowLeftIcon, ArrowRightIcon, EmailIcon } from '../../../../../shared/icons';

@Component({
  selector: 'fp-request-step',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon, CinefyInput, CinefyLoadingSpinner],
  templateUrl: './request-step.html',
  styleUrl: './request-step.scss',
})
export class RequestStep {
  protected readonly icons = {
    EmailIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly requested = output<string>();

  protected readonly submitting = signal(false);

  protected readonly requestForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
  });

  constructor() {
    effect(() => {
      if (this.submitting()) {
        this.requestForm.disable({ emitEvent: false });
      } else {
        this.requestForm.enable({ emitEvent: false });
      }
    });
  }

  protected onSubmit() {
    if (this.requestForm.invalid || this.submitting()) return;
    this.submitting.set(true);

    const email = this.requestForm.controls.email.value;
    this.authService
      .sendOtp({ email, otpType: 'RESET_PASSWORD' })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.requested.emit(email),
        error: () => {},
      });
  }
}
