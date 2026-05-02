import { Component, computed, input, TemplateRef, viewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal';
import { Stepper, StepperStep, StepperStepContext } from '../../stepper/stepper';

@Component({
  selector: 'manage-payment-modal',
  imports: [ModalComponent, Stepper],
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

  private readonly identityTpl = viewChild.required<TemplateRef<StepperStepContext>>('identity');
  private readonly credentialsTpl =
    viewChild.required<TemplateRef<StepperStepContext>>('credentials');
  private readonly integrationTpl =
    viewChild.required<TemplateRef<StepperStepContext>>('integration');
  private readonly verifyTpl = viewChild.required<TemplateRef<StepperStepContext>>('verify');
  private readonly reviewTpl = viewChild.required<TemplateRef<StepperStepContext>>('review');

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
}
