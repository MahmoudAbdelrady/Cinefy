import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { CustomSelectComponent, InputField, ModalComponent, Switch } from 'cinefy-ui/components';
import { ExternalLinkIcon, KeyIcon, LockIcon, WebhookIcon } from '../../../shared/icons';
import { NO_WHITESPACE_PATTERN } from '../../../shared/validation';
import type {
  GatewayProvider,
  PaymentChannel,
  PaymentGateway,
  PaymentGatewayRequest,
} from '../../../shared/types';
import { PaymentChannelsComponent } from '../payment-channels/payment-channels';
import { PAYMENT_PROVIDERS, type CredentialField, type ProviderSpec } from '../provider-spec';

function buildCredentialsGroup(
  fields: CredentialField[],
  storedCredentials: Record<string, string> | undefined,
  editMode: boolean,
): FormGroup<Record<string, FormControl<string>>> {
  const controls: Record<string, FormControl<string>> = {};
  for (const field of fields) {
    const keepStored = field.secret && editMode;
    controls[field.key] = new FormControl(storedCredentials?.[field.key] ?? '', {
      nonNullable: true,
      validators: keepStored
        ? [Validators.pattern(NO_WHITESPACE_PATTERN)]
        : [Validators.required, Validators.pattern(NO_WHITESPACE_PATTERN)],
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
  readonly gateway = input<PaymentGateway | null>(null);

  readonly gatewayCreated = output<PaymentGatewayRequest>();
  readonly gatewayUpdated = output<PaymentGatewayRequest>();

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

  protected readonly isEditMode = computed(() => this.gateway() !== null);

  protected readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Edit payment gateway' : 'Add payment gateway',
  );

  protected readonly modalDescription = computed(() =>
    this.isEditMode()
      ? "Update this gateway's configuration."
      : 'Connect a provider account so customers can pay online.',
  );

  protected readonly saveLabel = computed(() =>
    this.isEditMode() ? 'Save changes' : 'Add gateway',
  );

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
    effect(() => {
      const gateway = this.gateway();
      if (!gateway) return;
      this.form.patchValue({
        name: gateway.name,
        provider: gateway.provider,
        isActive: gateway.active,
      });
      const channels = gateway.paymentChannels ?? [];
      this.channels.set(channels);
      this.channelsEnabled.set(channels.length > 0);
    });

    effect(() =>
      this.form.setControl(
        'credentials',
        buildCredentialsGroup(
          this.providerSpec().credentialFields,
          this.gateway()?.credentials,
          this.isEditMode(),
        ),
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
    const { name, provider, credentials } = this.form.getRawValue();
    const channels = this.channels();
    const request: PaymentGatewayRequest = {
      name: name.trim(),
      provider,
      credentials,
      ...(channels.length ? { paymentChannels: channels } : {}),
    };
    if (this.isEditMode()) {
      this.gatewayUpdated.emit(request);
    } else {
      this.gatewayCreated.emit(request);
    }
    this.close()();
  }
}
