import { Component, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { PlusIcon } from '../../shared/icons';
import { HeaderActionsService } from '../../services';
import { GatewayListComponent, ManageGatewayModalComponent } from '../../components';

@Component({
  selector: 'payment-page',
  imports: [LucideDynamicIcon, ManageGatewayModalComponent, GatewayListComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class PaymentPage {
  protected readonly icons = {
    PlusIcon,
  };

  private readonly headerActions = inject(HeaderActionsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly headerActionsTemplate =
    viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  protected readonly gatewayList = viewChild.required(GatewayListComponent);

  protected readonly addGatewayVisible = signal(false);

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
