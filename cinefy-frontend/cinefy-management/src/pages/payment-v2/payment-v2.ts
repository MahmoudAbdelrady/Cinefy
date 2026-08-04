import { Component, DestroyRef, inject, TemplateRef, viewChild } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { PlusIcon } from '../../shared/icons';
import { HeaderActionsService } from '../../services';
import { GatewayListComponent, ManageGatewayModalComponent } from '../../components';

@Component({
  selector: 'payment-v2-page',
  imports: [NgpDialogTrigger, LucideDynamicIcon, ManageGatewayModalComponent, GatewayListComponent],
  templateUrl: './payment-v2.html',
  styleUrl: './payment-v2.scss',
})
export class PaymentV2Page {
  protected readonly icons = {
    PlusIcon,
  };

  private readonly headerActions = inject(HeaderActionsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly headerActionsTemplate =
    viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  ngOnInit(): void {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
