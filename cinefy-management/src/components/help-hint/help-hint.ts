import { Component, input } from '@angular/core';
import { Info, LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'help-hint',
  imports: [LucideAngularModule],
  templateUrl: './help-hint.html',
  styleUrl: './help-hint.scss',
})
export class HelpHint {
  readonly title = input.required<string>();
  readonly icon = input<LucideIconData>(Info);
}
