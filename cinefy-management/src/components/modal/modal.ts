import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import {
  NgpDialog,
  NgpDialogDescription,
  NgpDialogOverlay,
  NgpDialogTitle,
} from 'ng-primitives/dialog';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  imports: [NgpDialog, NgpDialogOverlay, NgpDialogTitle, NgpDialogDescription, LucideAngularModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class ModalComponent {
  readonly modalTitle = input<string | null>(null);
  readonly description = input<string>();
  readonly close = input.required<() => void>();
  readonly width = input<string>();
  readonly bodyPadding = input<string>('24px');
  readonly customHeader = input<boolean>(false);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly panelEl = computed(() => this.panel()?.nativeElement ?? null);

  protected readonly XIcon = X;
}
