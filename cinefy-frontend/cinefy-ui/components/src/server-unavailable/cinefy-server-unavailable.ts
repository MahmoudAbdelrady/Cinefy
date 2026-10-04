import { Component } from "@angular/core";
import { LucideDynamicIcon } from "@lucide/angular";
import { ServerOffIcon } from "../icons";

@Component({
  selector: "cui-server-unavailable",
  imports: [LucideDynamicIcon],
  templateUrl: "./cinefy-server-unavailable.html",
  styleUrl: "./cinefy-server-unavailable.scss",
})
export class CinefyServerUnavailable {
  protected readonly icons = {
    ServerOffIcon,
  };
}
