import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  type InputSignal,
  model,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { NgpInputOtp, NgpInputOtpInput, NgpInputOtpSlot } from "ng-primitives/input-otp";

@Component({
  selector: "input-otp",
  imports: [NgpInputOtp, NgpInputOtpInput, NgpInputOtpSlot],
  templateUrl: "./input-otp.html",
  styleUrl: "./input-otp.scss",
})
export class InputOtp {
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>("otpInput");

  readonly length = input(6);
  readonly value = model("");
  readonly error: InputSignal<string | null> = input<string | null>(null);

  readonly completeChange = output<boolean>();

  protected readonly shake = signal(false);

  protected readonly slotIndices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  private readonly complete = computed(() => this.value().length === this.length());

  constructor() {
    let last: boolean | null = null;
    effect(() => {
      const complete = this.complete();
      if (complete !== last) {
        last = complete;
        this.completeChange.emit(complete);
      }
    });

    // NgpInputOtp doesn't reset its native <input> when the bound value clears, so wipe it here.
    let wasFilled = false;
    effect(() => {
      const empty = this.value().length === 0;
      if (empty && wasFilled) this.clear();
      wasFilled = !empty;
    });

    // Shake once on each transition into an error state; auto-clears after the animation.
    let wasErrored = false;
    effect(() => {
      const hasError = this.error() !== null;
      if (hasError && !wasErrored) this.triggerShake();
      wasErrored = hasError;
    });
  }

  protected onValueChange(next: string) {
    this.value.set(next);
  }

  private clear() {
    this.inputEl().nativeElement.value = "";
    this.inputEl().nativeElement.focus();
  }

  private triggerShake() {
    this.shake.set(true);
    setTimeout(() => this.shake.set(false), 350);
  }
}
