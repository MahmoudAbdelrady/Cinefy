import { DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";

export function linkConfirmPassword(
  password: FormControl<string>,
  confirm: FormControl<string>,
  destroyRef: DestroyRef,
): void {
  confirm.addValidators((control) => {
    const confirmValue = control.value;
    const passwordValue = password.value;
    return !confirmValue || confirmValue === passwordValue
      ? null
      : { mismatch: true };
  });
  password.valueChanges
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(() => confirm.updateValueAndValidity());
}
