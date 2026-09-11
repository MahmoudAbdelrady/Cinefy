import { computed, type Signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { map, startWith, switchMap } from "rxjs";
import { AbstractControl } from "@angular/forms";

interface ControlState {
  touched: boolean;
  invalid: boolean;
}

function controlState(control: Signal<AbstractControl>): Signal<ControlState> {
  return toSignal(
    toObservable(control).pipe(
      switchMap((c) =>
        c.events.pipe(
          startWith(null),
          map(() => ({ touched: c.touched, invalid: c.invalid })),
        ),
      ),
    ),
    { initialValue: { touched: false, invalid: false } },
  );
}

export function isInvalidAndTouched(control: Signal<AbstractControl>): Signal<boolean> {
  const state = controlState(control);
  return computed(() => state().touched && state().invalid);
}
