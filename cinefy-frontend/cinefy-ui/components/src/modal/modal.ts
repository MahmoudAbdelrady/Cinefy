import { Component, ElementRef, computed, input, type InputSignal, viewChild } from "@angular/core";
import { NgpDialog, NgpDialogDescription, NgpDialogOverlay, NgpDialogTitle } from "ng-primitives/dialog";
import { LucideDynamicIcon } from "@lucide/angular";
import { XIcon } from "../icons";

@Component({
  selector: "app-modal",
  imports: [NgpDialog, NgpDialogOverlay, NgpDialogTitle, NgpDialogDescription, LucideDynamicIcon],
  templateUrl: "./modal.html",
  styleUrl: "./modal.scss",
})
export class ModalComponent {
  protected readonly icons = {
    XIcon,
  };

  private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");

  readonly modalTitle: InputSignal<string | null> = input<string | null>(null);
  readonly description = input<string>();
  readonly close = input.required<() => void>();
  readonly width = input<string>();
  readonly bodyPadding = input<string>("24px");
  readonly customHeader = input<boolean>(false);

  readonly panelEl = computed(() => this.panel()?.nativeElement ?? null);
}
