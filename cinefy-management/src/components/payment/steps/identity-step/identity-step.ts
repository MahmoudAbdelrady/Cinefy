import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgpRadioGroup, NgpRadioItem } from 'ng-primitives/radio';
import { Check, LucideAngularModule } from 'lucide-angular';
import { InputField } from '../../../input-field/input-field';

export function buildIdentityForm() {
  return new FormGroup({
    displayName: new FormControl('', {
      nonNullable: true,
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
  imports: [ReactiveFormsModule, NgpRadioGroup, NgpRadioItem, LucideAngularModule, InputField],
  templateUrl: './identity-step.html',
  styleUrl: './identity-step.scss',
})
export class IdentityStep {
  readonly form = input.required<IdentityForm>();

  protected readonly CheckIcon = Check;
}
