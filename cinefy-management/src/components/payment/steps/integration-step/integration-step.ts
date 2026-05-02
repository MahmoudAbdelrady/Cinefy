import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField } from '../../../input-field/input-field';
import { LucideAngularModule, PanelsTopLeft, Webhook } from 'lucide-angular';
import { HelpHint } from '../../help-hint/help-hint';

export function buildIntegrationForm() {
  return new FormGroup({
    integrationId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    iframeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}

export type IntegrationForm = ReturnType<typeof buildIntegrationForm>;

@Component({
  selector: 'integration-step',
  imports: [ReactiveFormsModule, LucideAngularModule, InputField, HelpHint],
  templateUrl: './integration-step.html',
  styleUrl: './integration-step.scss',
})
export class IntegrationStep {
  protected readonly WebHookIcon = Webhook;
  protected readonly PanelsIcon = PanelsTopLeft;

  readonly form = input.required<IntegrationForm>();
}
