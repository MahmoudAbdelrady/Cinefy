import { Component, input, type InputSignal } from "@angular/core";
import { LucideDynamicIcon, LucideIcon } from "@lucide/angular";

@Component({
  selector: "cui-empty-state",
  imports: [LucideDynamicIcon],
  templateUrl: "./cinefy-empty-state.html",
  styleUrl: "./cinefy-empty-state.scss",
})
export class CinefyEmptyState {
  readonly icon: InputSignal<LucideIcon | null> = input<LucideIcon | null>(null);
  readonly header = input.required<string>();
  readonly description: InputSignal<string | null> = input<string | null>(null);
}
