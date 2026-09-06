import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefySelect, FieldErrorComponent, CinefyInput, CinefySwitch } from 'cinefy-ui/components';
import { DeleteIcon, EditIcon, PlusIcon } from '../../../shared/icons';
import type { ChannelCurrency, PaymentChannel, ProviderConfigValue } from '../../../shared/types';
import type { ProviderConfigField } from '../provider-spec';

const CURRENCIES: ChannelCurrency[] = ['EGP', 'USD'];

const CURRENCY_ENTRIES = CURRENCIES.map((currency) => ({ value: currency, label: currency }));

const NEW_CHANNEL = 'new';

function buildProviderConfigGroup(
  fields: ProviderConfigField[],
  validator: ValidatorFn,
): FormGroup<Record<string, FormControl<ProviderConfigValue>>> {
  const controls: Record<string, FormControl<ProviderConfigValue>> = {};
  for (const field of fields) {
    controls[field.key] = new FormControl<ProviderConfigValue>('', {
      nonNullable: true,
      validators: [Validators.required],
    });
  }
  return new FormGroup(controls, { validators: validator });
}

@Component({
  selector: 'payment-channels',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    CinefyInput,
    FieldErrorComponent,
    CinefySelect,
    CinefySwitch,
    LucideDynamicIcon,
  ],
  templateUrl: './payment-channels.html',
  styleUrl: './payment-channels.scss',
})
export class PaymentChannelsComponent {
  protected readonly icons = {
    PlusIcon,
    EditIcon,
    DeleteIcon,
  };

  protected readonly currencyEntries = CURRENCY_ENTRIES;

  readonly providerConfig = input<ProviderConfigField[]>([]);

  readonly channels = model<PaymentChannel[]>([]);

  readonly openChange = output<boolean>();

  // `null` = form closed, `new` = adding, otherwise the index being edited.
  protected readonly channelFormTarget = signal<number | typeof NEW_CHANNEL | null>(null);

  protected readonly channelForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        (control) => this.duplicateNameValidator(control),
      ],
    }),
    currency: new FormControl<ChannelCurrency>('EGP', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
    providerConfig: new FormGroup<Record<string, FormControl<ProviderConfigValue>>>({}),
  });

  private readonly channelFormStatus = toSignal(
    this.channelForm.statusChanges.pipe(startWith(this.channelForm.status)),
  );

  protected readonly canCommit = computed(() => {
    this.channelFormStatus();
    return this.channelForm.valid;
  });

  protected readonly isChannelFormOpen = computed(() => this.channelFormTarget() !== null);

  protected readonly saveLabel = computed(() =>
    this.channelFormTarget() === NEW_CHANNEL ? 'Add channel' : 'Save channel',
  );

  constructor() {
    effect(() =>
      this.channelForm.setControl(
        'providerConfig',
        buildProviderConfigGroup(this.providerConfig(), (control) =>
          this.duplicateConfigValidator(control),
        ),
      ),
    );

    effect(() => this.openChange.emit(this.isChannelFormOpen()));

    effect(() => {
      this.channels();
      this.channelForm.controls.name.updateValueAndValidity();
      this.channelForm.controls.providerConfig.updateValueAndValidity();
    });
  }

  protected configControl(key: string): FormControl<ProviderConfigValue> | undefined {
    return this.channelForm.controls.providerConfig.controls[key];
  }

  protected startAdd() {
    this.channelForm.reset();
    this.channelFormTarget.set(NEW_CHANNEL);
  }

  protected startEdit(index: number) {
    const channel = this.channels()[index];
    this.channelFormTarget.set(index);
    this.channelForm.reset();
    this.channelForm.patchValue({
      name: channel.name,
      currency: channel.currency,
      isActive: channel.active,
    });
    for (const field of this.providerConfig()) {
      this.configControl(field.key)?.setValue(channel.providerConfig[field.key] ?? '');
    }
  }

  protected closeChannelForm() {
    this.channelFormTarget.set(null);
  }

  protected saveChannel() {
    if (!this.canCommit()) return;
    const { name, currency, isActive, providerConfig } = this.channelForm.getRawValue();
    const channel: PaymentChannel = {
      name: name.trim(),
      currency,
      active: isActive,
      providerConfig,
    };
    const target = this.channelFormTarget();
    this.channels.update((channels) =>
      target === NEW_CHANNEL
        ? [...channels, channel]
        : channels.map((existing, index) => (index === target ? channel : existing)),
    );
    this.channelFormTarget.set(null);
  }

  protected removeChannel(index: number) {
    this.channels.update((channels) => channels.filter((_, i) => i !== index));
    const target = this.channelFormTarget();
    if (typeof target === 'number' && target > index) this.channelFormTarget.set(target - 1);
  }

  protected toggleChannel(index: number, active: boolean) {
    this.channels.update((channels) =>
      channels.map((channel, i) => (i === index ? { ...channel, active } : channel)),
    );
  }

  private duplicateNameValidator(control: AbstractControl): ValidationErrors | null {
    const name = (control.value as string)?.trim().toLowerCase();
    if (!name) return null;
    const target = this.channelFormTarget();
    const taken = this.channels().some(
      (channel, index) => index !== target && channel.name.trim().toLowerCase() === name,
    );
    return taken ? { duplicateName: true } : null;
  }

  private duplicateConfigValidator(control: AbstractControl): ValidationErrors | null {
    const config = control.value as Record<string, ProviderConfigValue>;
    const keys = Object.keys(config ?? {});
    if (!keys.length || keys.some((key) => config[key] === '')) return null;

    const target = this.channelFormTarget();
    const taken = this.channels().some(
      (channel, index) =>
        index !== target &&
        keys.every((key) => String(channel.providerConfig[key]) === String(config[key])),
    );
    return taken ? { duplicateConfig: true } : null;
  }
}
