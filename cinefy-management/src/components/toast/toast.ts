import { Component, inject, viewChild } from '@angular/core';
import { LucideAngularModule, CircleCheckBig, CircleX, X } from 'lucide-angular';
import { NgpToast, NgpToastManager, injectToastContext } from 'ng-primitives/toast';
import { ToastContext } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [LucideAngularModule, NgpToast],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  host: {
    '[class.toast--success]': "context.variant === 'success'",
    '[class.toast--error]': "context.variant === 'error'",
  },
})
export class ToastComponent {
  protected readonly icons = {
    SuccessIcon: CircleCheckBig,
    ErrorIcon: CircleX,
    CloseIcon: X,
  };

  private readonly manager = inject(NgpToastManager);
  private readonly toast = viewChild.required<NgpToast>('toast');

  protected readonly context = injectToastContext<ToastContext>();

  protected dismiss(): void {
    this.manager.dismiss(this.toast());
  }
}
