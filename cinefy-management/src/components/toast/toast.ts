import { Component, HostBinding } from '@angular/core';
import { LucideAngularModule, CircleCheckBig, CircleX } from 'lucide-angular';
import { NgpToast, injectToastContext } from 'ng-primitives/toast';
import { ToastContext } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [LucideAngularModule, NgpToast],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  protected readonly context = injectToastContext<ToastContext>();
  protected readonly SuccessIcon = CircleCheckBig;
  protected readonly ErrorIcon = CircleX;

  @HostBinding('class.toast--success')
  get isSuccess() {
    return this.context.variant === 'success';
  }

  @HostBinding('class.toast--error')
  get isError() {
    return this.context.variant === 'error';
  }
}
