import { Component, input, output, type InputSignal } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";

type SwitchSize = "sm" | "md";

type SwitchColor = "accent" | "highlight";

@Component({
  selector: "cui-switch-v2",
  imports: [FormsModule, ReactiveFormsModule, ToggleSwitch],
  template: `@if (control(); as control) {
      <p-toggleswitch
        class="cui-switch-v2"
        [attr.data-size]="size()"
        [attr.data-color]="color()"
        [formControl]="control"
      />
    } @else {
      <p-toggleswitch
        class="cui-switch-v2"
        [attr.data-size]="size()"
        [attr.data-color]="color()"
        [ngModel]="checked()"
        [ngModelOptions]="{ standalone: true }"
        [disabled]="disabled()"
        (onChange)="checkedChange.emit($event.checked)"
      />
    }`,
  styleUrl: "./cinefy-switch.scss",
})
export class CinefySwitch {
  readonly control: InputSignal<FormControl<boolean> | null> = input<FormControl<boolean> | null>(null);
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly size: InputSignal<SwitchSize> = input<SwitchSize>("md");
  readonly color: InputSignal<SwitchColor> = input<SwitchColor>("accent");

  readonly checkedChange = output<boolean>();
}
