import { Component, computed, input, signal, TemplateRef, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { Stepper, StepperNoteTip, StepperStep } from '../../stepper/stepper';
import {
  IdentityStep,
  CredentialsStep,
  IntegrationStep,
  ReviewStep,
  VerificationStep,
  buildIdentityForm,
  buildCredentialsForm,
  buildIntegrationForm,
} from '../steps';
import { Lock, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'manage-payment-modal',
  imports: [
    ModalComponent,
    Stepper,
    IdentityStep,
    CredentialsStep,
    IntegrationStep,
    VerificationStep,
    ReviewStep,
    LucideAngularModule,
  ],
  templateUrl: './manage-payment-modal.html',
  styleUrl: './manage-payment-modal.scss',
})
export class ManagePaymentModalComponent {
  protected readonly LockIcon = Lock;

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
  private readonly verifyTpl = viewChild.required<TemplateRef<unknown>>('verify');
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
      description: 'Provide your API key and HMAC',
      content: this.credentialsTpl(),
    },
    {
      label: 'Link integration',
      description: 'Connect integration and iframe IDs',
      content: this.integrationTpl(),
    },
    {
      label: 'Test connection',
      description: 'Run read-only checks',
      content: this.verifyTpl(),
    },
    {
      label: 'Review and save',
      description: 'Confirm and save as draft',
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
