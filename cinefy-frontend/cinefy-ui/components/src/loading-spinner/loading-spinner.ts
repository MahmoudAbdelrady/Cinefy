import { Component, computed, input, type InputSignal } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import { LoaderIcon } from "../icons";

type LoadingSpinnerVariant = "xs" | "sm" | "md" | "lg" | "xl";

const VARIANT_PRESETS: Record<LoadingSpinnerVariant, { size: number; strokeWidth: number }> = {
  xs: { size: 14, strokeWidth: 2.5 },
  sm: { size: 16, strokeWidth: 2.5 },
  md: { size: 24, strokeWidth: 2 },
  lg: { size: 28, strokeWidth: 2.5 },
  xl: { size: 32, strokeWidth: 3 },
};

@Component({
  selector: "loading-spinner",
  imports: [LucideAngularModule],
  template: `<div class="spinner" [style.width.px]="resolvedSize()" [style.height.px]="resolvedSize()">
    <lucide-icon [img]="icons.LoaderIcon" [size]="resolvedSize()" [strokeWidth]="resolvedStrokeWidth()"></lucide-icon>
  </div>`,
  styles: `
    .spinner {
      display: grid;
      place-items: center;
      animation: spin 700ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class LoadingSpinnerComponent {
  protected readonly icons = {
    LoaderIcon,
  };

  readonly variant: InputSignal<LoadingSpinnerVariant | null> = input<LoadingSpinnerVariant | null>(null);
  readonly size: InputSignal<number | null> = input<number | null>(null);
  readonly strokeWidth: InputSignal<number | null> = input<number | null>(null);

  protected readonly resolvedSize = computed(() => this.size() ?? VARIANT_PRESETS[this.variant() ?? "md"].size);

  protected readonly resolvedStrokeWidth = computed(
    () => this.strokeWidth() ?? VARIANT_PRESETS[this.variant() ?? "md"].strokeWidth,
  );
}
