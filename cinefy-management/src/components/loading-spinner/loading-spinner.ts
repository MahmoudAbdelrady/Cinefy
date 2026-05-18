import { Component, input } from '@angular/core';
import { Loader, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'loading-spinner',
  imports: [LucideAngularModule],
  template: `<div class="spinner" [style.width.px]="size()" [style.height.px]="size()">
    <lucide-icon [img]="LoaderIcon" [size]="size()" [strokeWidth]="strokeWidth()"></lucide-icon>
  </div>`,
  styles: `
    .spinner {
      display: grid;
      place-items: center;
      animation: spin 700ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class LoadingSpinnerComponent {
  protected readonly LoaderIcon = Loader;

  readonly size = input(16);
  readonly strokeWidth = input(2.5);
}
