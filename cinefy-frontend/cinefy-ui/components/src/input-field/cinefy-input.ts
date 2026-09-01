import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  type InputSignal,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { startWith, switchMap } from "rxjs";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { LucideDynamicIcon, LucideIcon } from "@lucide/angular";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { EyeIcon, EyeOffIcon, XIcon } from "../icons";
import { FieldErrorComponent } from "../field-error/field-error";

type CinefyInputSize = "small" | "large";

@Component({
  selector: "cui-input",
  imports: [ReactiveFormsModule, LucideDynamicIcon, IconField, InputIcon, InputText, FieldErrorComponent],
  templateUrl: "./cinefy-input.html",
  styleUrl: "./cinefy-input.scss",
})
export class CinefyInput {
  protected readonly icons = {
    EyeIcon,
    EyeOffIcon,
    XIcon,
  };

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>("inputEl");

  readonly control = input.required<FormControl>();
  readonly label: InputSignal<string | null> = input<string | null>(null);
  readonly type = input<"text" | "number" | "password">("text");
  readonly placeholder = input<string>("");
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly leadingIcon: InputSignal<LucideIcon | null> = input<LucideIcon | null>(null);
  readonly errorMessages = input<Record<string, string>>({});
  readonly blockClipboard = input<boolean>(false);
  readonly size: InputSignal<CinefyInputSize> = input<CinefyInputSize>("large");
  readonly autoFocus = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly uppercase = input<boolean>(false);

  readonly blurred = output<void>();

  protected readonly showPassword = signal(false);

  private readonly controlValue = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.valueChanges.pipe(startWith(c.value)))),
    { initialValue: "" },
  );

  protected readonly isPassword = computed(() => this.type() === "password");

  protected readonly resolvedType = computed(() => {
    if (!this.isPassword()) return this.type();
    return this.showPassword() ? "text" : "password";
  });

  protected readonly showClear = computed(() => this.clearable() && !this.isPassword() && !!this.controlValue());

  protected readonly hasErrorMessages = computed(() => Object.keys(this.errorMessages()).length > 0);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.focus();
    });
  }

  protected get required(): boolean {
    const c = this.control();
    return c.hasValidator(Validators.required) && c.enabled;
  }

  focus() {
    this.inputEl()?.nativeElement.focus();
  }

  protected toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  protected clear() {
    this.control().setValue("");
    this.focus();
  }

  protected onClipboardEvent(event: ClipboardEvent) {
    if (this.blockClipboard()) {
      event.preventDefault();
    }
  }
}
