import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { CustomSelectComponent, InputField, Switch } from 'cinefy-ui/components';
import { DeleteIcon, EditIcon, PlusIcon } from '../../../shared/icons';
import type { ChannelCurrency, PaymentChannel, ProviderConfigValue } from '../../../shared/types';
import type { ProviderConfigField } from '../provider-spec';

const CURRENCIES: ChannelCurrency[] = ['EGP', 'USD'];

const NEW_CHANNEL = 'new';

function buildProviderConfigGroup(
  fields: ProviderConfigField[],
): FormGroup<Record<string, FormControl<ProviderConfigValue>>> {
  const controls: Record<string, FormControl<ProviderConfigValue>> = {};
  for (const field of fields) {
    controls[field.key] = new FormControl<ProviderConfigValue>('', {
      nonNullable: true,
      validators: [Validators.required],
    });
  }
  return new FormGroup(controls);
}

@Component({
  selector: 'payment-channels',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    InputField,
    CustomSelectComponent,
    Switch,
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

  protected readonly currencies = CURRENCIES;

  readonly providerConfig = input<ProviderConfigField[]>([]);

  readonly channels = model<PaymentChannel[]>([]);

  readonly openChange = output<boolean>();

  // `null` = form closed, `new` = adding, otherwise the index being edited.
  protected readonly channelFormTarget = signal<number | typeof NEW_CHANNEL | null>(null);

  protected readonly channelForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
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

  protected readonly currencyDisplayFn = (currency: ChannelCurrency) => currency;

  constructor() {
    effect(() =>
      this.channelForm.setControl(
        'providerConfig',
        buildProviderConfigGroup(this.providerConfig()),
      ),
    );

    effect(() => this.openChange.emit(this.isChannelFormOpen()));
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
    this.channelForm.reset();
    this.channelForm.patchValue({
      name: channel.name,
      currency: channel.currency,
      isActive: channel.isActive,
    });
    for (const field of this.providerConfig()) {
      this.configControl(field.key)?.setValue(channel.providerConfig[field.key] ?? '');
    }
    this.channelFormTarget.set(index);
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
      isActive,
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

  protected toggleChannel(index: number, isActive: boolean) {
    this.channels.update((channels) =>
      channels.map((channel, i) => (i === index ? { ...channel, isActive } : channel)),
    );
  }
}
