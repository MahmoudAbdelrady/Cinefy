import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { CustomSelectComponent, InputField, ModalComponent, Switch } from 'cinefy-ui/components';
import { ExternalLinkIcon, KeyIcon, LockIcon, WebhookIcon } from '../../../shared/icons';
import { NO_WHITESPACE_PATTERN } from '../../../shared/validation';
import type { GatewayProvider, PaymentChannel, PaymentGatewayRequest } from '../../../shared/types';
import { PaymentChannelsComponent } from '../payment-channels/payment-channels';
import { PAYMENT_PROVIDERS, type CredentialField, type ProviderSpec } from '../provider-spec';

function buildCredentialsGroup(
  fields: CredentialField[],
): FormGroup<Record<string, FormControl<string>>> {
  const controls: Record<string, FormControl<string>> = {};
  for (const field of fields) {
    controls[field.key] = new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
    });
  }
  return new FormGroup(controls);
}

@Component({
  selector: 'manage-gateway-modal',
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputField,
    CustomSelectComponent,
    Switch,
    LucideDynamicIcon,
    PaymentChannelsComponent,
  ],
  templateUrl: './manage-gateway-modal.html',
  styleUrl: './manage-gateway-modal.scss',
})
export class ManageGatewayModalComponent {
  protected readonly icons = {
    KeyIcon,
    LockIcon,
    ExternalLinkIcon,
    WebhookIcon,
  };

  protected readonly providers = PAYMENT_PROVIDERS;

  readonly close = input.required<() => void>();

  readonly gatewayCreated = output<PaymentGatewayRequest>();

  protected readonly channels = signal<PaymentChannel[]>([]);
  protected readonly channelsEnabled = signal(false);
  protected readonly channelFormOpen = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    provider: new FormControl<GatewayProvider>('PAYMOB', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isActive: new FormControl(false, { nonNullable: true }),
    credentials: new FormGroup<Record<string, FormControl<string>>>({}),
  });

  private readonly formStatus = toSignal(this.form.statusChanges.pipe(startWith(this.form.status)));

  private readonly provider = toSignal(this.form.controls.provider.valueChanges, {
    initialValue: this.form.controls.provider.value,
  });

  private readonly isActive = toSignal(this.form.controls.isActive.valueChanges, {
    initialValue: this.form.controls.isActive.value,
  });

  protected readonly providerSpec = computed(
    () => this.providers.find((spec) => spec.provider === this.provider()) ?? this.providers[0],
  );

  protected readonly channelsRequired = computed(() => this.providerSpec().channelsRequired);

  protected readonly showChannelsSection = computed(
    () =>
      this.providerSpec().supportsChannels && (this.channelsRequired() || this.channelsEnabled()),
  );

  protected readonly canSave = computed(() => {
    this.formStatus();
    if (this.channelFormOpen()) return false;
    if (
      this.channelsRequired() &&
      this.providerSpec().supportsChannels &&
      !this.channels().length
    ) {
      return false;
    }
    return this.form.valid;
  });

  protected readonly activeHint = computed(() =>
    this.isActive()
      ? 'New payments will route to this gateway.'
      : 'This gateway stays configured but takes no payments.',
  );

  protected readonly providerDisplayFn = (spec: ProviderSpec) => spec.label;

  protected readonly providerValueFn = (spec: ProviderSpec) => spec.provider;

  constructor() {
    effect(() =>
      this.form.setControl(
        'credentials',
        buildCredentialsGroup(this.providerSpec().credentialFields),
      ),
    );
  }

  protected credentialControl(key: string): FormControl<string> {
    return this.form.controls.credentials.controls[key];
  }

  protected onChannelsToggle(enabled: boolean) {
    this.channelsEnabled.set(enabled);
    if (!enabled) {
      this.channels.set([]);
      this.channelFormOpen.set(false);
    }
  }

  protected save() {
    if (!this.canSave()) return;
    const { name, provider, isActive, credentials } = this.form.getRawValue();
    const channels = this.channels();
    this.gatewayCreated.emit({
      name: name.trim(),
      provider,
      isActive,
      credentials,
      ...(channels.length ? { channels } : {}),
    });
    this.close()();
  }
}
