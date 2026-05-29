import { Component, Injectable, inject, viewChild } from "@angular/core";
import { LucideAngularModule, CircleCheckBig, CircleX, X } from "lucide-angular";
import {
  NgpToast,
  NgpToastManager,
  injectToastContext,
  provideToastConfig,
  type NgpToastConfig,
} from "ng-primitives/toast";
import type { ToastContext } from "cinefy-ui/types";

@Component({
  selector: "app-toast",
  imports: [LucideAngularModule, NgpToast],
  templateUrl: "./toast.html",
  styleUrl: "./toast.scss",
  host: {
    "[class.toast--success]": "context.variant === 'success'",
    "[class.toast--error]": "context.variant === 'error'",
  },
})
class ToastComponent {
  protected readonly icons = {
    CircleCheckBigIcon: CircleCheckBig,
    CircleXIcon: CircleX,
    XIcon: X,
  };

  private readonly manager = inject(NgpToastManager);
  private readonly toast = viewChild.required<NgpToast>("toast");

  protected readonly context = injectToastContext<ToastContext>();

  protected dismiss(): void {
    this.manager.dismiss(this.toast());
  }
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly manager = inject(NgpToastManager);

  success(message: string): void {
    this.manager.show(ToastComponent, {
      context: { message, variant: "success" } satisfies ToastContext,
    });
  }

  error(message: string): void {
    this.manager.show(ToastComponent, {
      context: { message, variant: "error" } satisfies ToastContext,
    });
  }
}

const TOAST_DEFAULTS: Partial<NgpToastConfig> = {
  placement: "top-center",
  duration: 4000,
  offsetBottom: 24,
  offsetRight: 24,
  dismissible: true,
  maxToasts: 5,
  gap: 8,
  zIndex: 9999,
};

export function provideCinefyToast(overrides: Partial<NgpToastConfig> = {}) {
  return provideToastConfig({ ...TOAST_DEFAULTS, ...overrides });
}
