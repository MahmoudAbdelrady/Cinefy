import { Component, input } from '@angular/core';
import { Loader, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'loading-spinner',
  imports: [LucideAngularModule],
  template: `<lucide-icon
    [img]="LoaderIcon"
    [size]="size()"
    [strokeWidth]="strokeWidth()"
  ></lucide-icon>`,
  styles: `
    :host {
      display: inline-flex;
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
  readonly size = input(16);
  readonly strokeWidth = input(2.5);

  protected readonly LoaderIcon = Loader;
}
