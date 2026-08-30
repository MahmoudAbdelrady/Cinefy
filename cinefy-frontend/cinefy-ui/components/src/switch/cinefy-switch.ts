import { Component, input, type InputSignal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";

type SwitchSize = "sm" | "md";

type SwitchColor = "accent" | "highlight";

@Component({
  selector: "cui-switch-v2",
  imports: [ReactiveFormsModule, ToggleSwitch],
  template: `<p-toggleswitch
    class="cui-switch-v2"
    [attr.data-size]="size()"
    [attr.data-color]="color()"
    [formControl]="control()"
  />`,
  styleUrl: "./cinefy-switch.scss",
})
export class CinefySwitch {
  readonly control = input.required<FormControl<boolean>>();
  readonly size: InputSignal<SwitchSize> = input<SwitchSize>("md");
  readonly color: InputSignal<SwitchColor> = input<SwitchColor>("accent");
}
