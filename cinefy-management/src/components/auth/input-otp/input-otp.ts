import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NgpInputOtp, NgpInputOtpInput, NgpInputOtpSlot } from 'ng-primitives/input-otp';

@Component({
  selector: 'input-otp',
  imports: [NgpInputOtp, NgpInputOtpInput, NgpInputOtpSlot],
  templateUrl: './input-otp.html',
  styleUrl: './input-otp.scss',
})
export class InputOtp {
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('otpInput');

  readonly length = input(6);
  readonly value = model('');
  readonly error = input<string | null>(null);
  readonly shake = input(false);

  readonly completeChange = output<boolean>();

  protected readonly slotIndices = computed(() =>
    Array.from({ length: this.length() }, (_, i) => i),
  );

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
  }

  protected onValueChange(next: string) {
    this.value.set(next);
  }

  clear() {
    this.inputEl().nativeElement.value = '';
    this.value.set('');
    this.inputEl().nativeElement.focus();
  }
}
