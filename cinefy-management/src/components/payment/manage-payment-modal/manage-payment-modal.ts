import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { merge, startWith } from 'rxjs';
import { ModalComponent } from '../../modal/modal';
import { Stepper, StepperNoteTip, StepperStep } from '../../stepper/stepper';
import {
  IdentityStep,
  CredentialsStep,
  IntegrationStep,
  ReviewStep,
  buildIdentityForm,
  buildCredentialsForm,
  buildIntegrationForm,
} from '../steps';
import { Lock, LucideAngularModule } from 'lucide-angular';
import type { PaymentMethod } from '../../../shared/types';

@Component({
  selector: 'manage-payment-modal',
  imports: [
    ModalComponent,
    Stepper,
    IdentityStep,
    CredentialsStep,
    IntegrationStep,
    ReviewStep,
    LucideAngularModule,
  ],
  templateUrl: './manage-payment-modal.html',
  styleUrl: './manage-payment-modal.scss',
})
export class ManagePaymentModalComponent {
  protected readonly LockIcon = Lock;

  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<() => void>();

  protected readonly isEditMode = false;

  protected readonly modalTitle = computed(() =>
    this.isEditMode ? 'Edit payment method' : 'Add payment method',
  );

  protected readonly modalDescription = computed(() =>
    this.isEditMode
      ? 'Update the configuration for this payment method.'
      : 'Connect a new gateway so customers can pay through Cinefy.',
  );

  private readonly identityTpl = viewChild.required<TemplateRef<unknown>>('identity');
  private readonly credentialsTpl = viewChild.required<TemplateRef<unknown>>('credentials');
  private readonly integrationTpl = viewChild.required<TemplateRef<unknown>>('integration');
  private readonly reviewTpl = viewChild.required<TemplateRef<unknown>>('review');
  private readonly paymobHelpTpl = viewChild.required<TemplateRef<unknown>>('paymobHelp');

  protected readonly steps = computed<StepperStep[]>(() => [
    {
      label: 'Identify method',
      description: 'Set a name and environment',
      content: this.identityTpl(),
    },
    {
      label: 'Add credentials',
      description: 'Secret, HMAC, and public keys',
      content: this.credentialsTpl(),
    },
    {
      label: 'Link integration',
      description: 'Integration ID and currency',
      content: this.integrationTpl(),
    },
    {
      label: 'Review and test',
      description: 'Confirm details and test connection',
      content: this.reviewTpl(),
    },
  ]);

  protected readonly stepperNoteTip = computed<StepperNoteTip>(() => ({
    title: 'Need help?',
    content: this.paymobHelpTpl(),
  }));

  protected readonly form = new FormGroup({
    identity: buildIdentityForm(),
    credentials: buildCredentialsForm(),
    integration: buildIntegrationForm(),
  });

  protected readonly currentStep = signal(0);
  protected readonly connectionTestRequested = signal(false);

  constructor() {
    merge(this.form.controls.credentials.valueChanges, this.form.controls.integration.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.connectionTestRequested.set(false));
  }

  private readonly stepForms = [
    this.form.controls.identity,
    this.form.controls.credentials,
    this.form.controls.integration,
  ];

  private readonly formStatus = toSignal(
    merge(...this.stepForms.map((f) => f.statusChanges)).pipe(startWith(null)),
  );

  private readonly formValue = toSignal(
    merge(...this.stepForms.map((f) => f.valueChanges)).pipe(startWith(null)),
  );

  protected readonly currentStepValid = computed(() => {
    this.formStatus();
    return this.stepForms[this.currentStep()]?.valid ?? true;
  });

  protected readonly paymentMethodValue = computed<PaymentMethod>(() => {
    this.formValue();
    const identity = this.form.controls.identity.controls;
    const credentials = this.form.controls.credentials.controls;
    const integration = this.form.controls.integration.controls;
    return {
      name: identity.name.value,
      type: identity.type.value ?? 'CARD',
      isTest: identity.environment.value === 'sandbox',
      currency: integration.currency.value ?? '',
      publicKey: credentials.publicKey.value,
      secretKey: credentials.secretKey.value,
      hmacSecret: credentials.hmacSecret.value,
      integrationId: integration.integrationId.value ?? 0,
      connectionTestRequested: this.connectionTestRequested(),
    };
  });

  protected goToNextStep() {
    if (this.currentStep() < this.steps().length - 1) {
      this.currentStep.update((step) => step + 1);
    }
  }

  protected goToPreviousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((step) => step - 1);
    }
  }

  protected saveAsDraft() {
    // TODO: implement save logic
  }
}
