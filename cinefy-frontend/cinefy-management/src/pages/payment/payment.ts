import { Component, DestroyRef, inject, TemplateRef, viewChild } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { PlusIcon } from '../../shared/icons';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { HeaderActionsService } from '../../services';
import { ManagePaymentModalComponent, PaymentMethodListComponent } from '../../components';

@Component({
  selector: 'payment-page',
  imports: [
    NgpDialogTrigger,
    LucideDynamicIcon,
    ManagePaymentModalComponent,
    PaymentMethodListComponent,
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class PaymentPage {
  protected readonly icons = {
    PlusIcon,
  };

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');
  protected paymentMethodList = viewChild.required(PaymentMethodListComponent);

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
