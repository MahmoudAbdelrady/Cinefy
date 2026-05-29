import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField, CustomSelectComponent } from 'cinefy-ui/components';
import { LucideAngularModule } from 'lucide-angular';
import { WebhookIcon } from '../../../../shared/icons';
import { HelpHint } from '../../../help-hint/help-hint';

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
  protected readonly icons = {
    WebhookIcon,
  };

  readonly form = input.required<IntegrationForm>();
  readonly container = input<string | HTMLElement | null>(null);

  protected readonly currencyOptions = Object.keys(CURRENCY_LABELS) as Currency[];

  protected readonly currencyDisplayFn = (c: Currency) => CURRENCY_LABELS[c];

  protected onCurrencyChange(currency: Currency) {
    this.form().controls.currency.setValue(currency);
  }
}
