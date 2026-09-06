import { Component, computed, DestroyRef, inject, input, output, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { distinctUntilChanged, startWith, switchMap } from "rxjs";
import { InputOtp as PrimeInputOtp } from "primeng/inputotp";
import { CinefyFieldError } from "../field-error/cinefy-field-error";

@Component({
  selector: "cui-input-otp",
  imports: [ReactiveFormsModule, PrimeInputOtp, CinefyFieldError],
  templateUrl: "./cinefy-input-otp.html",
  styleUrl: "./cinefy-input-otp.scss",
})
export class CinefyInputOtp {
  private readonly destroyRef = inject(DestroyRef);

  readonly control = input.required<FormControl<string>>();
  readonly errorMessages = input<Record<string, string>>({});
  readonly length = input(6);

  readonly completeChange = output<boolean>();

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
