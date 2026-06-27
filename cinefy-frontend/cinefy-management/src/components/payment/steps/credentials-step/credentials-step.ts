import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { KeyIcon, LockIcon } from '../../../../shared/icons';
import { InputField } from 'cinefy-ui/components';
import { HelpHint } from '../../../help-hint/help-hint';
import { NO_WHITESPACE_PATTERN } from '../../../../shared/validation';

export function buildCredentialsForm() {
  return new FormGroup({
    secretKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
    }),
    hmacSecret: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
    }),
    publicKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
    }),
  });
}

export type CredentialsForm = ReturnType<typeof buildCredentialsForm>;

@Component({
  selector: 'credentials-step',
  imports: [ReactiveFormsModule, LucideDynamicIcon, InputField, HelpHint],
  templateUrl: './credentials-step.html',
  styleUrl: './credentials-step.scss',
})
export class CredentialsStep {
  protected readonly icons = {
    LockIcon,
    KeyIcon,
  };

  readonly form = input.required<CredentialsForm>();
  readonly isEditMode = input(false);
}
