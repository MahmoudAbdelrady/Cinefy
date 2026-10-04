import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, startWith } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CinefySelect,
  CinefyInput,
  CinefyLoadingSpinner,
  CinefyDialog,
  CinefyDialogFooter,
  CinefySwitch,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { ExternalLinkIcon, KeyIcon, LockIcon, WebhookIcon } from '../../../shared/icons';
import { NO_WHITESPACE_PATTERN, RESOURCE_NAME_PATTERN } from '../../../shared/constants';
import type {
  GatewayProvider,
  PaymentChannel,
  PaymentGateway,
  PaymentGatewayRequest,
} from '../../../shared/types';
import { PaymentGatewaysService } from '../../../services';
import { PaymentChannelsComponent } from '../payment-channels/payment-channels';
import { PAYMENT_PROVIDERS, type CredentialField } from '../provider-spec';

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
    CinefyDialog,
    CinefyDialogFooter,
    CinefyInput,
    CinefySelect,
    CinefySwitch,
    LucideDynamicIcon,
    CinefyLoadingSpinner,
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

  private readonly paymentGatewaysService = inject(PaymentGatewaysService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild.required(CinefyDialog);

  protected readonly providers = PAYMENT_PROVIDERS;

  readonly gateway = input<PaymentGateway | null>(null);

  readonly closed = output<void>();
  readonly gatewayCreated = output<PaymentGateway>();
  readonly gatewayUpdated = output<PaymentGateway>();

  protected readonly saving = signal(false);
  protected readonly channels = signal<PaymentChannel[]>([]);
  protected readonly channelsEnabled = signal(false);
  protected readonly channelFormOpen = signal(false);
  private readonly initialFormSnapshot = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(60),
        Validators.pattern(RESOURCE_NAME_PATTERN),
      ],
    }),
    provider: new FormControl<GatewayProvider>(
      { value: 'PAYMOB', disabled: true },
      {
        nonNullable: true,
        validators: [Validators.required],
      },
    ),
    credentials: new FormGroup<Record<string, FormControl<string>>>({}),
  });

  private readonly formStatus = toSignal(this.form.statusChanges.pipe(startWith(this.form.status)));

  private readonly provider = toSignal(this.form.controls.provider.valueChanges, {
    initialValue: this.form.controls.provider.value,
  });

  private readonly currentFormValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly hasChanges = computed(() => {
    const snapshot = this.initialFormSnapshot();
    if (snapshot === null) return true;
    this.currentFormValue();
    this.channels();
    return this.snapshotValue() !== snapshot;
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
    if (this.isEditMode() && !this.hasChanges()) return false;
    if (
      this.channelsRequired() &&
      this.providerSpec().supportsChannels &&
      !this.channels().length
    ) {
      return false;
    }
    return this.form.valid;
  });

  constructor() {
    effect(() => {
      const gateway = this.gateway();
      if (!gateway) return;
      this.form.patchValue({
        name: gateway.name,
        provider: gateway.provider,
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

    effect(() => {
      if (this.saving()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
        this.form.controls.provider.disable({ emitEvent: false });
      }
    });

    afterNextRender(() => {
      if (this.isEditMode()) this.initialFormSnapshot.set(this.snapshotValue());
    });
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
    if (!this.canSave() || this.saving()) return;

    const { name, provider, credentials } = this.form.getRawValue();
    const channels = this.channels();
    const request: PaymentGatewayRequest = {
      name: name.trim(),
      provider,
      credentials,
      ...(channels.length ? { paymentChannels: channels } : {}),
    };

    const editing = this.gateway();

    this.saving.set(true);
    const save$ = editing
      ? this.paymentGatewaysService.updatePaymentGateway(editing.id, request)
      : this.paymentGatewaysService.createPaymentGateway(request);

    save$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (gateway) => {
          if (editing) {
            this.gatewayUpdated.emit(gateway);
          } else {
            this.gatewayCreated.emit(gateway);
          }
          this.toastService.success(editing ? 'Payment gateway updated' : 'Payment gateway added');
          this.dialog().close();
        },
        error: () => {},
      });
  }

  private snapshotValue(): string {
    return JSON.stringify({ ...this.form.getRawValue(), channels: this.channels() });
  }
}
