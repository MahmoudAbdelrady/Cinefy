import { Injectable, signal, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeaderActionsService {
  readonly template = signal<TemplateRef<unknown> | null>(null);
}
