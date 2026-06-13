import { Component, input, type InputSignal } from "@angular/core";
import { LucideDynamicIcon, LucideIcon } from "@lucide/angular";

@Component({
  selector: "empty-state",
  imports: [LucideDynamicIcon],
  templateUrl: "./empty-state.html",
  styleUrl: "./empty-state.scss",
})
export class EmptyStateComponent {
  readonly icon: InputSignal<LucideIcon | null> = input<LucideIcon | null>(null);
  readonly title = input.required<string>();
  readonly description: InputSignal<string | null> = input<string | null>(null);
}
