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
import { CinefyFieldError } from "../field-error/cinefy-field-error";
import { isInvalidAndTouched } from "../field-error/control-state";
import { CinefyLoadingSpinner } from "../loading-spinner/cinefy-loading-spinner";

type CinefyInputSize = "small" | "large";

@Component({
  selector: "cui-input",
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    IconField,
    InputIcon,
    InputText,
    CinefyFieldError,
    CinefyLoadingSpinner,
  ],
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
  readonly preventWhitespace = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly readonly = input<boolean>(false);

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

  protected readonly showClear = computed(
    () => this.clearable() && !this.readonly() && !this.isPassword() && !!this.controlValue(),
  );

  protected readonly hasErrorMessages = computed(() => Object.keys(this.errorMessages()).length > 0);

  protected readonly isInvalid = isInvalidAndTouched(this.control);

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

  protected onInput(event: Event) {
    const el = event.target as HTMLInputElement;

    const original = el.value;

    let value = original;
    if (this.preventWhitespace()) value = this.stripWhitespace(el, value);
    if (this.uppercase()) value = this.toUpperCase(el, value);
    if (value === original) return;

    this.control().setValue(value);
  }

  private stripWhitespace(el: HTMLInputElement, value: string): string {
    const stripped = value.replace(/\s/g, "");
    if (stripped === value) return value;

    const caret = el.selectionStart;
    el.value = stripped;
    if (caret !== null) {
      const nextCaret = caret - (value.length - stripped.length);
      el.setSelectionRange(nextCaret, nextCaret);
    }

    return stripped;
  }

  private toUpperCase(el: HTMLInputElement, value: string): string {
    const uppercased = value.toUpperCase();
    if (uppercased === value) return value;

    const caret = el.selectionStart;
    el.value = uppercased;
    if (caret !== null) el.setSelectionRange(caret, caret);

    return uppercased;
  }
}
