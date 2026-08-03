import { Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { CustomSelectComponent, InputField, ModalComponent, Switch } from 'cinefy-ui/components';
import { ExternalLinkIcon, KeyIcon, LockIcon } from '../../../shared/icons';
import { NO_WHITESPACE_PATTERN } from '../../../shared/validation';
import {
  GATEWAY_PROVIDER_LABELS,
  type GatewayProvider,
  type PaymentGatewayRequest,
} from '../../../shared/types';

interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
  placeholder: string;
  hint: string;
}

interface ProviderConfigField {
  key: string;
  label: string;
  type: 'text' | 'number';
}

interface ProviderSpec {
  provider: GatewayProvider;
  label: string;
  supportsChannels: boolean;
  channelsRequired: boolean;
  channelHelp: string;
  docsUrl: string;
  credentialFields: CredentialField[];
  providerConfig?: ProviderConfigField[];
}

const PAYMENT_PROVIDERS: ProviderSpec[] = [
  {
    provider: 'PAYMOB',
    label: GATEWAY_PROVIDER_LABELS.PAYMOB,
    supportsChannels: true,
    channelsRequired: true,
    channelHelp: 'Where to find: Settings → Developers → Payment Integrations',
    docsUrl: 'https://developers.paymob.com/paymob-docs/getting-started/overview',
    credentialFields: [
      {
        key: 'secretKey',
        label: 'Secret key',
        secret: true,
        placeholder: 'egy_sk_live_…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
      {
        key: 'publicKey',
        label: 'Public key',
        secret: false,
        placeholder: 'egy_pk_live_…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
      {
        key: 'hmacKey',
        label: 'HMAC key',
        secret: true,
        placeholder: 'b4a91c84e6f7d3a1…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
    ],
    providerConfig: [
      {
        key: 'integrationId',
        label: 'Integration ID',
        type: 'number',
      },
    ],
  },
];

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
  ],
  templateUrl: './manage-gateway-modal.html',
  styleUrl: './manage-gateway-modal.scss',
})
export class ManageGatewayModalComponent {
  protected readonly icons = {
    KeyIcon,
    LockIcon,
    ExternalLinkIcon,
  };

  protected readonly providers = PAYMENT_PROVIDERS;

  readonly close = input.required<() => void>();

  readonly gatewayCreated = output<PaymentGatewayRequest>();

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

  protected readonly canSave = computed(() => {
    this.formStatus();
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

  protected save() {
    if (!this.canSave()) return;
    const { name, provider, isActive, credentials } = this.form.getRawValue();
    this.gatewayCreated.emit({
      name: name.trim(),
      provider,
      isActive,
      credentials,
    });
    this.close()();
  }
}
