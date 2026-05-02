import { Component, input } from '@angular/core';
import { Info, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'help-hint',
  imports: [LucideAngularModule],
  templateUrl: './help-hint.html',
  styleUrl: './help-hint.scss',
})
export class HelpHint {
  protected readonly InfoIcon = Info;

  readonly title = input.required<string>();
}
