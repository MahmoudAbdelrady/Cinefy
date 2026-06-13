import { Component, input } from '@angular/core';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import { InfoIcon } from '../../shared/icons';

@Component({
  selector: 'help-hint',
  imports: [LucideDynamicIcon],
  templateUrl: './help-hint.html',
  styleUrl: './help-hint.scss',
})
export class HelpHint {
  readonly title = input.required<string>();
  readonly icon = input<LucideIcon>(InfoIcon);
}
