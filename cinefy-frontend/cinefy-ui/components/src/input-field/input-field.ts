import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  type InputSignal,
  signal,
  viewChild,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { LucideDynamicIcon, LucideIcon } from "@lucide/angular";
import { EyeIcon, EyeOffIcon } from "../icons";
import { NgpInput } from "ng-primitives/input";
import { NgpButton } from "ng-primitives/button";
import { FieldErrorComponent } from "../field-error/field-error";

type InputFieldSize = "sm" | "md";

@Component({
  selector: "input-field",
  imports: [ReactiveFormsModule, NgpInput, NgpButton, LucideDynamicIcon, FieldErrorComponent],
  templateUrl: "./input-field.html",
  styleUrl: "./input-field.scss",
})
export class InputField {
  protected readonly icons = {
    EyeIcon,
    EyeOffIcon,
  };

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>("inputEl");

  readonly control = input.required<FormControl>();
  readonly label: InputSignal<string | null> = input<string | null>(null);
  readonly type = input<"text" | "number" | "password">("text");
  readonly placeholder = input<string>("");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly leadingIcon: InputSignal<LucideIcon | null> = input<LucideIcon | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly monospace = input<boolean>(false);
  readonly blockClipboard = input<boolean>(false);
  readonly size: InputSignal<InputFieldSize> = input<InputFieldSize>("md");
  readonly autoFocus = input<boolean>(false);

  protected readonly showPassword = signal(false);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.inputEl()?.nativeElement.focus();
    });
  }

  protected readonly resolvedType = computed(() => {
    if (this.type() !== "password") return this.type();
    return this.showPassword() ? "text" : "password";
  });

  protected get required(): boolean {
    const c = this.control();
    return c.hasValidator(Validators.required) && c.enabled;
  }

  protected toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  protected onClipboardEvent(event: ClipboardEvent) {
    if (this.blockClipboard()) {
      event.preventDefault();
    }
  }
}
