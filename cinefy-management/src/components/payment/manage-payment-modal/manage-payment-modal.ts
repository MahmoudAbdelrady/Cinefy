import { Component, computed, input, signal, TemplateRef, viewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal';
import { Stepper, StepperStep } from '../../stepper/stepper';
import {
  IdentityStep,
  CredentialsStep,
  IntegrationStep,
  ReviewStep,
  VerificationStep,
} from '../steps';

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
  ],
  templateUrl: './manage-payment-modal.html',
  styleUrl: './manage-payment-modal.scss',
})
export class ManagePaymentModalComponent {
  readonly close = input.required<() => void>();

  protected readonly isEditMode = false;

  protected readonly modalTitle = computed(() =>
    this.isEditMode ? 'Edit Payment Method' : 'Add Payment Method',
  );

  protected readonly modalDescription = computed(() =>
    this.isEditMode
      ? 'Update the details of your payment method.'
      : 'Provide the necessary information to add a new payment method.',
  );

  private readonly identityTpl = viewChild.required<TemplateRef<unknown>>('identity');
  private readonly credentialsTpl = viewChild.required<TemplateRef<unknown>>('credentials');
  private readonly integrationTpl = viewChild.required<TemplateRef<unknown>>('integration');
  private readonly verifyTpl = viewChild.required<TemplateRef<unknown>>('verify');
  private readonly reviewTpl = viewChild.required<TemplateRef<unknown>>('review');

  protected readonly steps = computed<StepperStep[]>(() => [
    {
      label: 'Identity',
      description: 'Name & environment',
      content: this.identityTpl(),
    },
    {
      label: 'Credentials',
      description: 'API key & HMAC',
      content: this.credentialsTpl(),
    },
    {
      label: 'Integration',
      description: 'IDs & iframe',
      content: this.integrationTpl(),
    },
    {
      label: 'Verify',
      description: 'Test the connection',
      content: this.verifyTpl(),
    },
    {
      label: 'Review',
      description: 'Save as draft',
      content: this.reviewTpl(),
    },
  ]);

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
