import { Component, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArrowLeft, ArrowRight, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { InputField } from '../../../../input-field/input-field';
import { LoadingSpinnerComponent } from '../../../../loading-spinner/loading-spinner';
import { AtSignIcon } from '../../../../../shared/icons';

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
    ArrowRightIcon: ArrowRight,
    ArrowLeftIcon: ArrowLeft,
  };

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
    const value = this.requestForm.controls.username.value;
    setTimeout(() => {
      this.submitting.set(false);
      this.requested.emit(value);
    }, 1100);
  }
}
