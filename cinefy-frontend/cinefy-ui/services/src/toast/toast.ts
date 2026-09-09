import { Injectable, inject, type Provider } from "@angular/core";
import { MessageService } from "primeng/api";
import { CINEFY_TOAST_KEY } from "cinefy-ui/constants";

@Injectable({ providedIn: "root" })
export class CinefyToastService {
  private readonly messageService = inject(MessageService);

  success(message: string): void {
    this.messageService.add({
      key: CINEFY_TOAST_KEY,
      severity: "success",
      summary: message,
    });
  }

  error(message: string): void {
    this.messageService.add({
      key: CINEFY_TOAST_KEY,
      severity: "error",
      summary: message,
    });
  }
}

export function provideCinefyToast(): Provider[] {
  return [MessageService];
}
