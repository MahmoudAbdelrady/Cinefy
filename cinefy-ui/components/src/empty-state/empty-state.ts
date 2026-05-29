import { Component, input, type InputSignal } from "@angular/core";
import { LucideAngularModule, LucideIconData } from "lucide-angular";

@Component({
  selector: "empty-state",
  imports: [LucideAngularModule],
  templateUrl: "./empty-state.html",
  styleUrl: "./empty-state.scss",
})
export class EmptyStateComponent {
  readonly icon: InputSignal<LucideIconData | null> = input<LucideIconData | null>(null);
  readonly title = input.required<string>();
  readonly description: InputSignal<string | null> = input<string | null>(null);
}
