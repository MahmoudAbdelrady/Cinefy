import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArrowRightIcon, ShieldCheckIcon } from '../../../../../shared/icons';

@Component({
  selector: 'fp-done-step',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './done-step.html',
  styleUrl: './done-step.scss',
})
export class DoneStep {
  protected readonly icons = {
    ShieldCheckIcon,
    ArrowRightIcon,
  };
}
