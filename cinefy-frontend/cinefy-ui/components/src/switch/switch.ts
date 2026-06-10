import { Component, effect, input, output, untracked, viewChild, type InputSignal } from "@angular/core";
import { NgpSwitch, NgpSwitchThumb } from "ng-primitives/switch";

type SwitchSize = "sm" | "md";

type SwitchColor = "accent" | "highlight";

@Component({
  selector: "cui-switch",
  imports: [NgpSwitch, NgpSwitchThumb],
  template: `<button
    #switch="ngpSwitch"
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

  private readonly switch = viewChild.required<NgpSwitch>("switch");

  constructor() {
    // Keep the uncontrolled NgpSwitch in sync: when its internal state and [checked] diverge, force it back to [checked] so the switch is fully controlled by the input.
    effect(() => {
      const desired = this.checked();
      const directive = this.switch();
      if (directive.state.checked() !== desired) {
        untracked(() => directive.setChecked(desired));
      }
    });
  }
}
