import { Component, computed, input } from '@angular/core';
import { ModalComponent } from '../../modal/modal';

@Component({
  selector: 'manage-payment-modal',
  imports: [ModalComponent],
  templateUrl: './manage-payment-modal.html',
  styleUrl: './manage-payment-modal.scss',
})
export class ManagePaymentModalComponent {
  readonly close = input.required<() => void>();

  protected readonly isEditMode = false;

  protected readonly modalTitle = computed(() =>
    this.isEditMode ? 'Edit Payment Method' : 'Add Payment Method',
  );
}
