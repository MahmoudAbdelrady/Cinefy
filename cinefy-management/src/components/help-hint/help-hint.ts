import { Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { InfoIcon } from '../../shared/icons';

@Component({
  selector: 'help-hint',
  imports: [LucideAngularModule],
  templateUrl: './help-hint.html',
  styleUrl: './help-hint.scss',
})
export class HelpHint {
  readonly title = input.required<string>();
  readonly icon = input<LucideIconData>(InfoIcon);
}
