import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField } from '../../../input-field/input-field';
import { LucideAngularModule, Webhook } from 'lucide-angular';
import { HelpHint } from '../../../help-hint/help-hint';
import { CustomSelectComponent } from '../../../drop-down/custom-select/custom-select';

const CURRENCY_LABELS = {
  EGP: 'EGP',
  USD: 'USD',
} as const;

export type Currency = keyof typeof CURRENCY_LABELS;

export function buildIntegrationForm() {
  return new FormGroup({
    integrationId: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    currency: new FormControl<Currency | null>(null, {
      validators: [Validators.required],
    }),
  });
}

export type IntegrationForm = ReturnType<typeof buildIntegrationForm>;

@Component({
  selector: 'integration-step',
  imports: [ReactiveFormsModule, LucideAngularModule, InputField, HelpHint, CustomSelectComponent],
  templateUrl: './integration-step.html',
  styleUrl: './integration-step.scss',
})
export class IntegrationStep {
  protected readonly WebHookIcon = Webhook;

  readonly form = input.required<IntegrationForm>();

  protected readonly currencyOptions = Object.keys(CURRENCY_LABELS) as Currency[];

  protected readonly currencyDisplayFn = (c: Currency) => CURRENCY_LABELS[c];

  protected onCurrencyChange(currency: Currency) {
    this.form().controls.currency.setValue(currency);
  }
}
