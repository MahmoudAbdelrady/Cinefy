import { Component, DestroyRef, inject, TemplateRef, viewChild } from '@angular/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { HeaderActionsService } from '../../services';
import { ManagePaymentModalComponent } from '../../components';

@Component({
  selector: 'payment-page',
  imports: [NgpDialogTrigger, LucideAngularModule, ManagePaymentModalComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class PaymentPage {
  protected readonly PlusIcon = Plus;

  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);
  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
