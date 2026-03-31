import { Component, input } from '@angular/core';
import {
  NgpDialog,
  NgpDialogDescription,
  NgpDialogOverlay,
  NgpDialogTitle,
} from 'ng-primitives/dialog';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  imports: [
    NgpDialog,
    NgpDialogOverlay,
    NgpDialogTitle,
    NgpDialogDescription,
    LucideAngularModule,
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class ModalComponent {
  readonly modalTitle = input.required<string>();
  readonly description = input<string>();
  readonly close = input.required<() => void>();
  readonly width = input<string>();

  protected readonly XIcon = X;
}
