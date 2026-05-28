import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, Validators } from '@angular/forms';
import { merge, startWith } from 'rxjs';
import { ModalComponent } from '../../modal/modal';
import { Stepper, StepperNoteTip, StepperStep } from '../../stepper/stepper';
import { LoadingSpinnerComponent, ToastService } from 'cinefy-ui';
import {
  IdentityStep,
  CredentialsStep,
  IntegrationStep,
  ReviewStep,
  buildIdentityForm,
  buildCredentialsForm,
  buildIntegrationForm,
  type Currency,
  type TestResultState,
} from '../steps';
import { LucideAngularModule } from 'lucide-angular';
import { LockIcon } from '../../../shared/icons';
import { PaymentMethodService } from '../../../services';
import type { PaymentMethod, PaymentMethodSummary } from '../../../shared/types';

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
    LoadingSpinnerComponent,
  ],
  templateUrl: './manage-payment-modal.html',
  styleUrl: './manage-payment-modal.scss',
})
export class ManagePaymentModalComponent {
  protected readonly icons = {
    LockIcon,
  };

  private readonly destroyRef = inject(DestroyRef);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly toastService = inject(ToastService);

  private readonly identityTpl = viewChild.required<TemplateRef<unknown>>('identity');
  private readonly credentialsTpl = viewChild.required<TemplateRef<unknown>>('credentials');
  private readonly integrationTpl = viewChild.required<TemplateRef<unknown>>('integration');
  private readonly reviewTpl = viewChild.required<TemplateRef<unknown>>('review');
  private readonly paymobHelpTpl = viewChild.required<TemplateRef<unknown>>('paymobHelp');

  readonly close = input.required<() => void>();
  readonly methodId = input<string | null>(null);

  readonly paymentMethodCreated = output<PaymentMethodSummary>();
  readonly paymentMethodUpdated = output<PaymentMethodSummary>();

  protected readonly currentStep = signal(0);
  protected readonly connectionTestRequested = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadingDetail = signal(false);
  protected readonly initialTestResult = signal<TestResultState | null>(null);

  protected readonly form = new FormGroup({
    identity: buildIdentityForm(),
    credentials: buildCredentialsForm(),
    integration: buildIntegrationForm(),
  });

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

  protected readonly isEditMode = computed(() => this.methodId() !== null);

  protected readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Edit payment method' : 'Add payment method',
  );

  protected readonly modalDescription = computed(() =>
    this.isEditMode()
      ? 'Update the configuration for this payment method.'
      : 'Connect a new gateway so customers can pay through Cinefy.',
  );

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

  constructor() {
    merge(this.form.controls.credentials.valueChanges, this.form.controls.integration.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.connectionTestRequested.set(false);
        this.initialTestResult.set(null);
      });

    effect(() => this.applyEditModeValidators(this.isEditMode()));
    effect(() => this.loadMethodIfEditing(this.methodId()));
  }

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

  protected save() {
    if (this.saving()) return;
    const id = this.methodId();
    this.saving.set(true);
    const request$ = id
      ? this.paymentMethodService.updatePaymentMethod(id, this.paymentMethodValue())
      : this.paymentMethodService.createPaymentMethod(this.paymentMethodValue());

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.saving.set(false);
        if (id) {
          this.paymentMethodUpdated.emit(result);
          this.toastService.success('Payment method updated');
        } else {
          this.paymentMethodCreated.emit(result);
          this.toastService.success('Payment method created');
        }
        this.close()();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to save payment method');
      },
    });
  }

  private applyEditModeValidators(editMode: boolean) {
    const secretCtrl = this.form.controls.credentials.controls.secretKey;
    const hmacCtrl = this.form.controls.credentials.controls.hmacSecret;
    if (editMode) {
      secretCtrl.clearValidators();
      hmacCtrl.clearValidators();
    } else {
      secretCtrl.setValidators(Validators.required);
      hmacCtrl.setValidators(Validators.required);
    }
    secretCtrl.updateValueAndValidity();
    hmacCtrl.updateValueAndValidity();
  }

  private loadMethodIfEditing(id: string | null) {
    if (!id) return;
    this.loadingDetail.set(true);
    this.paymentMethodService
      .getPaymentMethod(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.form.controls.identity.patchValue({
            name: detail.name,
            type: detail.type,
            environment: detail.isTest ? 'sandbox' : 'production',
          });
          this.form.controls.credentials.controls.publicKey.setValue(detail.publicKey);
          this.form.controls.integration.patchValue({
            integrationId: detail.integrationId,
            currency: detail.currency as Currency,
          });
          if (detail.testStatus !== 'UNTESTED') {
            this.initialTestResult.set({
              testStatus: detail.testStatus,
              testFailureReason: detail.testFailureReason,
              testedAt: detail.testedAt,
            });
          }
          this.loadingDetail.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loadingDetail.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load payment method');
          this.close()();
        },
      });
  }
}
