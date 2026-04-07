import { Injectable, inject } from '@angular/core';
import { NgpToastManager } from 'ng-primitives/toast';
import { ToastComponent } from '../components/toast/toast';

export interface ToastContext {
  message: string;
  variant: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly manager = inject(NgpToastManager);

  success(message: string): void {
    this.manager.show(ToastComponent, {
      context: { message, variant: 'success' } satisfies ToastContext,
    });
  }

  error(message: string): void {
    this.manager.show(ToastComponent, {
      context: { message, variant: 'error' } satisfies ToastContext,
    });
  }
}
