import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KeyRound, Lock, LucideAngularModule } from 'lucide-angular';
import { InputField } from '../../../input-field/input-field';
import { HelpHint } from '../../../help-hint/help-hint';

export function buildCredentialsForm() {
  return new FormGroup({
    secretKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    hmac: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    publicKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}

export type CredentialsForm = ReturnType<typeof buildCredentialsForm>;

@Component({
  selector: 'credentials-step',
  imports: [ReactiveFormsModule, LucideAngularModule, InputField, HelpHint],
  templateUrl: './credentials-step.html',
  styleUrl: './credentials-step.scss',
})
export class CredentialsStep {
  protected readonly LockIcon = Lock;
  protected readonly KeyIcon = KeyRound;

  readonly form = input.required<CredentialsForm>();
}
