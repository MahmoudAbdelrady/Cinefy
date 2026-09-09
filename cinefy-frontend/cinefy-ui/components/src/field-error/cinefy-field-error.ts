import { Component, input } from "@angular/core";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "cui-field-error",
  template: `
    @if (control().touched && control().errors; as errors) {
      @for (key of messageKeys; track key) {
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

  protected get messageKeys() {
    return Object.keys(this.messages());
  }
}
