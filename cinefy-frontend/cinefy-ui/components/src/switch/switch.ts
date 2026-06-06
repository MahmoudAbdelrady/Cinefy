import { Component, input, output, type InputSignal } from "@angular/core";
import { NgpSwitch, NgpSwitchThumb } from "ng-primitives/switch";

type SwitchSize = "sm" | "md";

type SwitchColor = "accent" | "highlight";

@Component({
  selector: "cui-switch",
  imports: [NgpSwitch, NgpSwitchThumb],
  template: `<button
    ngpSwitch
    class="cui-switch"
    [attr.data-size]="size()"
    [attr.data-color]="color()"
    [ngpSwitchChecked]="checked()"
    [ngpSwitchDisabled]="disabled()"
    (ngpSwitchCheckedChange)="checkedChange.emit($event)"
  >
    <span ngpSwitchThumb></span>
  </button>`,
  styleUrl: "./switch.scss",
})
export class Switch {
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly size: InputSignal<SwitchSize> = input<SwitchSize>("md");
  readonly color: InputSignal<SwitchColor> = input<SwitchColor>("accent");

  readonly checkedChange = output<boolean>();
}
