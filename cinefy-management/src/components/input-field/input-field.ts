import { Component, computed, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Eye, EyeOff, LucideAngularModule, LucideIconData } from 'lucide-angular';
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
  protected readonly EyeIcon = Eye;
  protected readonly EyeOffIcon = EyeOff;

  readonly control = input.required<FormControl>();
  readonly label = input<string | null>(null);
  readonly type = input<'text' | 'number' | 'password'>('text');
  readonly placeholder = input<string>('');
  readonly hint = input<string | null>(null);
  readonly leadingIcon = input<LucideIconData | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly size = input<'sm' | 'md'>('md');
  readonly monospace = input<boolean>(false);

  protected readonly showPassword = signal(false);

  private readonly statusTrigger = signal(0);

  constructor() {
    effect((onCleanup) => {
      const sub = this.control().statusChanges.subscribe(() => {
        this.statusTrigger.update((n) => n + 1);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected readonly required = computed(() => {
    this.statusTrigger();
    return this.control().hasValidator(Validators.required);
  });

  protected readonly resolvedType = computed(() => {
    if (this.type() !== 'password') return this.type();
    return this.showPassword() ? 'text' : 'password';
  });

  protected toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }
}
