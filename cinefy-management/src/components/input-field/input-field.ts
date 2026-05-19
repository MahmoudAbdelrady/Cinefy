import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { EyeOff, LucideAngularModule, LucideIconData } from 'lucide-angular';
import { EyeIcon } from '../../shared/icons';
import { NgpInput } from 'ng-primitives/input';
import { NgpButton } from 'ng-primitives/button';
import { FieldErrorComponent } from '../field-error/field-error';

@Component({
  selector: 'input-field',
  imports: [ReactiveFormsModule, NgpInput, NgpButton, LucideAngularModule, FieldErrorComponent],
  templateUrl: './input-field.html',
  styleUrl: './input-field.scss',
})
export class InputField {
  protected readonly icons = {
    EyeIcon,
    EyeOffIcon: EyeOff,
  };

  readonly control = input.required<FormControl>();
  readonly label = input<string | null>(null);
  readonly type = input<'text' | 'number' | 'password'>('text');
  readonly placeholder = input<string>('');
  readonly hint = input<string | null>(null);
  readonly leadingIcon = input<LucideIconData | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly monospace = input<boolean>(false);

  protected readonly showPassword = signal(false);

  protected readonly resolvedType = computed(() => {
    if (this.type() !== 'password') return this.type();
    return this.showPassword() ? 'text' : 'password';
  });

  protected get required(): boolean {
    const c = this.control();
    return c.hasValidator(Validators.required) && c.enabled;
  }

  protected toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }
}
