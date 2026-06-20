import { Component, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputField } from 'cinefy-ui/components';
import { EMAIL_PATTERN } from '../../../../../shared/validation';
import { ArrowLeftIcon, ArrowRightIcon, EmailIcon } from '../../../../../shared/icons';

@Component({
  selector: 'fp-request-step',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon, InputField],
  templateUrl: './request-step.html',
  styleUrl: './request-step.scss',
})
export class RequestStep {
  protected readonly icons = {
    EmailIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
  };

  readonly requested = output<string>();

  protected readonly requestForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
  });

  protected onSubmit() {
    if (this.requestForm.invalid) return;
    this.requested.emit(this.requestForm.controls.email.value);
  }
}
