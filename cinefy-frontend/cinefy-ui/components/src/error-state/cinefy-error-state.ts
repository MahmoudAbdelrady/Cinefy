import { Component, input, type InputSignal } from "@angular/core";
import { LucideDynamicIcon } from "@lucide/angular";
import { TriangleAlertIcon } from "../icons";

const DEFAULT_DESCRIPTION = "Something went wrong. Please try again later.";

@Component({
  selector: "cui-error-state",
  imports: [LucideDynamicIcon],
  templateUrl: "./cinefy-error-state.html",
  styleUrl: "../empty-state/cinefy-empty-state.scss",
})
export class CinefyErrorState {
  protected readonly icons = {
    TriangleAlertIcon,
  };

  readonly header = input.required<string>();
  readonly description: InputSignal<string> = input<string>(DEFAULT_DESCRIPTION);
}
