import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { StatsCard } from '../../shared/types';

@Component({
  selector: 'app-stats',
  imports: [LucideAngularModule],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class StatsComponent {
  readonly cards = input.required<StatsCard[]>();

  protected readonly VARIANTS = ['blue', 'green', 'purple', 'orange'] as const;
}
