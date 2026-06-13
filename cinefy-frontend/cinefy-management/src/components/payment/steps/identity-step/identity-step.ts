import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgpRadioGroup, NgpRadioItem } from 'ng-primitives/radio';
import { LucideDynamicIcon } from '@lucide/angular';
import { CheckIcon } from '../../../../shared/icons';
import { InputField, CustomSelectComponent } from 'cinefy-ui/components';
import { PAYMENT_METHOD_TYPE_LABELS, type PaymentMethodType } from '../../../../shared/types';

export function buildIdentityForm() {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl<PaymentMethodType | null>(null, {
      validators: [Validators.required],
    }),
    environment: new FormControl<'sandbox' | 'production'>('sandbox', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}

export type IdentityForm = ReturnType<typeof buildIdentityForm>;

@Component({
  selector: 'identity-step',
  imports: [
    ReactiveFormsModule,
    NgpRadioGroup,
    NgpRadioItem,
    LucideDynamicIcon,
    InputField,
    CustomSelectComponent,
  ],
  templateUrl: './identity-step.html',
  styleUrl: './identity-step.scss',
})
export class IdentityStep {
  protected readonly icons = {
    CheckIcon,
  };
  readonly form = input.required<IdentityForm>();
  readonly container = input<string | HTMLElement | null>(null);

  protected readonly typeOptions = Object.keys(PAYMENT_METHOD_TYPE_LABELS) as PaymentMethodType[];

  protected readonly typeDisplayFn = (type: PaymentMethodType) => PAYMENT_METHOD_TYPE_LABELS[type];

  protected onTypeChange(type: PaymentMethodType) {
    this.form().controls.type.setValue(type);
  }
}
