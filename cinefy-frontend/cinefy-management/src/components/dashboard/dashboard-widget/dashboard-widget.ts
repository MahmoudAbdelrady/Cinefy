import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';

@Component({
  selector: 'dashboard-widget',
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './dashboard-widget.html',
  styleUrl: './dashboard-widget.scss',
})
export class DashboardWidgetComponent {
  readonly icon = input.required<LucideIcon>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly iconColor = input.required<string>();
  readonly actionLabel = input<string>();
  readonly actionIcon = input<LucideIcon>();
  readonly actionLink = input<string>();
}
