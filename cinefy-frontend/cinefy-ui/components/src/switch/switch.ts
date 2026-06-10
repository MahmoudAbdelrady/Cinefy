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
    (ngpSwitchCheckedChange)="onCheckedChange($event)"
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

  private reconciling = false;

  constructor() {
    // Force the uncontrolled NgpSwitch back to [checked] when it diverges, so the input fully controls the switch.
    effect(() => {
      const desired = this.checked();
      const directive = this.switch();
      if (directive.state.checked() !== desired) {
        this.reconciling = true;
        untracked(() => directive.setChecked(desired));
        this.reconciling = false;
      }
    });
  }

  protected onCheckedChange(checked: boolean): void {
    // Swallow reconciliation's re-emit; only genuine user interaction emits.
    if (this.reconciling) return;
    this.checkedChange.emit(checked);
  }
}
