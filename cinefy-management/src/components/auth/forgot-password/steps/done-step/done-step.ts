import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowRight, LucideAngularModule, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'fp-done-step',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './done-step.html',
  styleUrl: './done-step.scss',
})
export class DoneStep {
  protected readonly icons = {
    ShieldIcon: ShieldCheck,
    ArrowRightIcon: ArrowRight,
  };
}
