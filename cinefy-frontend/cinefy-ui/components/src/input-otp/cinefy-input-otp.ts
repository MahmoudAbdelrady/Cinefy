import { Component, computed, DestroyRef, inject, input, output, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { distinctUntilChanged, startWith, switchMap } from "rxjs";
import { InputOtp as PrimeInputOtp } from "primeng/inputotp";

@Component({
  selector: "cui-input-otp",
  imports: [ReactiveFormsModule, PrimeInputOtp],
  templateUrl: "./cinefy-input-otp.html",
  styleUrl: "./cinefy-input-otp.scss",
  host: {
    "(keydown.enter)": "onEnter.emit()",
  },
})
export class CinefyInputOtp {
  private readonly destroyRef = inject(DestroyRef);

  readonly control = input.required<FormControl<string>>();
  readonly length = input(6);

  readonly completeChange = output<boolean>();
  readonly onEnter = output<void>();

  private readonly value = signal("");

  private readonly complete = computed(() => this.value().length === this.length());

  constructor() {
    toObservable(this.control)
      .pipe(
        switchMap((control) => control.valueChanges.pipe(startWith(control.value))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.value.set(value));

    toObservable(this.complete)
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((complete) => this.completeChange.emit(complete));
  }
}
