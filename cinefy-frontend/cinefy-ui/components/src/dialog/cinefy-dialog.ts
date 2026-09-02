import { Component, Directive, computed, contentChild, input, output, signal, type InputSignal } from "@angular/core";
import { Dialog } from "primeng/dialog";

type CinefyDialogStyle = Partial<CSSStyleDeclaration>;

@Directive({ selector: "[customHeader]" })
export class CinefyDialogHeader {}

@Directive({ selector: "[customFooter]" })
export class CinefyDialogFooter {}

@Component({
  selector: "cui-dialog",
  imports: [Dialog],
  templateUrl: "./cinefy-dialog.html",
  styleUrl: "./cinefy-dialog.scss",
})
export class CinefyDialog {
  private readonly projectedHeader = contentChild(CinefyDialogHeader);
  private readonly projectedFooter = contentChild(CinefyDialogFooter);

  readonly header: InputSignal<string | null> = input<string | null>(null);
  readonly description: InputSignal<string | null> = input<string | null>(null);
  readonly canClose = input(true);
  readonly style: InputSignal<CinefyDialogStyle | null> = input<CinefyDialogStyle | null>(null);

  readonly closed = output<void>();

  protected readonly visible = signal(true);

  protected readonly hasCustomHeader = computed(() => !!this.projectedHeader());
  protected readonly hasCustomFooter = computed(() => !!this.projectedFooter());

  close(): void {
    this.visible.set(false);
  }
}
