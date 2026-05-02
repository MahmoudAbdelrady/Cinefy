import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Info, KeyRound, Lock, LucideAngularModule } from 'lucide-angular';
import { InputField } from '../../../input-field/input-field';

export function buildCredentialsForm() {
  return new FormGroup({
    apiKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    hmac: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}

export type CredentialsForm = ReturnType<typeof buildCredentialsForm>;

@Component({
  selector: 'credentials-step',
  imports: [ReactiveFormsModule, LucideAngularModule, InputField],
  templateUrl: './credentials-step.html',
  styleUrl: './credentials-step.scss',
})
export class CredentialsStep {
  readonly form = input.required<CredentialsForm>();

  protected readonly LockIcon = Lock;
  protected readonly KeyIcon = KeyRound;
  protected readonly InfoIcon = Info;
}
