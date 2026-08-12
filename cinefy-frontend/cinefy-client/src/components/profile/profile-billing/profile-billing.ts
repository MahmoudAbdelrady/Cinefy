import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { EmptyStateComponent, LoadingSpinnerComponent, ModalComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { ClientService } from '../../../services';
import { CreditCardIcon, TrashIcon, TriangleAlertIcon } from '../../../shared/icons';
import { brandChip } from '../../../shared/payments';
import type { ClientPaymentMethod } from '../../../shared/types';

@Component({
  selector: 'profile-billing',
  imports: [
    LucideDynamicIcon,
    NgpDialogTrigger,
    ModalComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './profile-billing.html',
  styleUrl: './profile-billing.scss',
})
export class ProfileBillingComponent {
  protected readonly icons = {
    CreditCardIcon,
    TrashIcon,
    TriangleAlertIcon,
  };

  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly paymentMethods = signal<ClientPaymentMethod[]>([]);
  protected readonly loading = signal(true);
  protected readonly removing = signal(false);

  protected readonly brandChip = brandChip;

  constructor() {
    afterNextRender(() => this.loadPaymentMethods());
  }

  private loadPaymentMethods(): void {
    this.clientService
      .getPaymentMethods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (methods) => {
          this.paymentMethods.set(methods);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected confirmRemove(method: ClientPaymentMethod, close: () => void): void {
    if (this.removing()) return;

    this.removing.set(true);
    this.clientService
      .deletePaymentMethod(method.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.paymentMethods.update((methods) => methods.filter((m) => m.id !== method.id));
          this.removing.set(false);
          close();
          this.toastService.success('Card removed');
        },
        error: () => this.removing.set(false),
      });
  }
}
