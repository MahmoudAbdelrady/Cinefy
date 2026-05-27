import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { InputField } from '../../../../input-field/input-field';
import { LoadingSpinnerComponent } from '../../../../loading-spinner/loading-spinner';
import { ArrowLeftIcon, ArrowRightIcon, AtSignIcon } from '../../../../../shared/icons';
import { AuthService } from '../../../../../services/auth';
import { ToastService } from '../../../../../services/toast';

@Component({
  selector: 'fp-request-step',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    NgpButton,
    InputField,
    LoadingSpinnerComponent,
  ],
  templateUrl: './request-step.html',
  styleUrl: './request-step.scss',
})
export class RequestStep {
  protected readonly icons = {
    AtSignIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly requested = output<string>();

  protected readonly submitting = signal(false);

  protected readonly requestForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected onSubmit() {
    if (this.requestForm.invalid || this.submitting()) return;
    this.submitting.set(true);
    const username = this.requestForm.controls.username.value;
    this.authService
      .forgotPassword({ username })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.requested.emit(username);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.error('Could not send the reset code. Please try again.');
        },
      });
  }
}
