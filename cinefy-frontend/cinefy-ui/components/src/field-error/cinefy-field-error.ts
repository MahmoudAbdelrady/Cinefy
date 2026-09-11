import { Component, computed, input } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { map, startWith, switchMap } from "rxjs";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "cui-field-error",
  template: `
    @if (errors(); as errors) {
      @for (key of messageKeys(); track key) {
        @if (errors[key]) {
          <span>{{ messages()[key] }}</span>
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
      font-size: 12px;
      color: var(--cui-text-error);
      margin-top: 4px;
    }
    span {
      display: block;
    }
    span + span {
      margin-top: 2px;
    }
  `,
})
export class CinefyFieldError {
  readonly control = input.required<AbstractControl>();
  readonly messages = input.required<Record<string, string>>();

  protected readonly errors = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(() => control.errors),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly messageKeys = computed(() => Object.keys(this.messages()));
}
