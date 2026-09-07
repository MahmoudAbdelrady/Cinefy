import { Component, computed, effect, input, output, type InputSignal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";

type SwitchSize = "sm" | "md";

type SwitchColor = "accent" | "highlight";

@Component({
  selector: "cui-switch",
  imports: [ReactiveFormsModule, ToggleSwitch],
  template: `<p-toggleswitch
    class="cui-switch"
    [attr.data-size]="size()"
    [attr.data-color]="color()"
    [formControl]="activeControl()"
    (onChange)="checkedChange.emit($event.checked)"
  />`,
  styleUrl: "./cinefy-switch.scss",
})
export class CinefySwitch {
  readonly control: InputSignal<FormControl<boolean> | null> = input<FormControl<boolean> | null>(null);
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly size: InputSignal<SwitchSize> = input<SwitchSize>("md");
  readonly color: InputSignal<SwitchColor> = input<SwitchColor>("accent");

  readonly checkedChange = output<boolean>();

  private readonly internalControl = new FormControl<boolean>(false, { nonNullable: true });

  protected readonly activeControl = computed(() => this.control() ?? this.internalControl);

  constructor() {
    effect(() => {
      if (this.control()) return;

      const checked = this.checked();
      if (this.internalControl.value !== checked) {
        this.internalControl.setValue(checked, { emitEvent: false });
      }
      this.disabled()
        ? this.internalControl.disable({ emitEvent: false })
        : this.internalControl.enable({ emitEvent: false });
    });
  }
}
