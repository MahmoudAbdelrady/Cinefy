import { Component, computed, input, type InputSignal } from "@angular/core";
import { ProgressSpinner } from "primeng/progressspinner";

type LoadingSpinnerVariant = "xs" | "sm" | "md" | "lg" | "xl";

const VARIANT_PRESETS: Record<LoadingSpinnerVariant, { width: number; height: number; strokeWidth: number }> = {
  xs: { width: 14, height: 14, strokeWidth: 10 },
  sm: { width: 16, height: 16, strokeWidth: 10 },
  md: { width: 24, height: 24, strokeWidth: 8 },
  lg: { width: 28, height: 28, strokeWidth: 10 },
  xl: { width: 32, height: 32, strokeWidth: 12 },
};

@Component({
  selector: "cui-loading-spinner",
  imports: [ProgressSpinner],
  template: `<p-progress-spinner [strokeWidth]="resolvedStrokeWidth()" [style]="spinnerStyle()" />`,
  styles: `
    :host {
      --p-progressspinner-color-one: currentColor;
      --p-progressspinner-color-two: currentColor;
      --p-progressspinner-color-three: currentColor;
      --p-progressspinner-color-four: currentColor;
      --p-content-border-color: transparent;

      ::ng-deep .p-progressspinner {
        display: flex;
      }
    }
  `,
})
export class CinefyLoadingSpinner {
  readonly variant: InputSignal<LoadingSpinnerVariant | null> = input<LoadingSpinnerVariant | null>(null);
  readonly strokeWidth: InputSignal<number | null> = input<number | null>(null);

  private readonly preset = computed(() => VARIANT_PRESETS[this.variant() ?? "md"]);

  protected readonly spinnerStyle = computed(() => ({
    width: `${this.preset().width}px`,
    height: `${this.preset().height}px`,
  }));

  protected readonly resolvedStrokeWidth = computed(() => this.strokeWidth() ?? this.preset().strokeWidth);
}
