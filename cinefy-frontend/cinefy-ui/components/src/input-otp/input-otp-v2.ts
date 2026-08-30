import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { InputOtp as PrimeInputOtp } from "primeng/inputotp";
import { FieldErrorComponent } from "../field-error/field-error";

@Component({
  selector: "input-otp-v2",
  imports: [ReactiveFormsModule, PrimeInputOtp, FieldErrorComponent],
  templateUrl: "./input-otp-v2.html",
  styleUrl: "./input-otp-v2.scss",
})
export class InputOtpV2 {
  readonly control = input.required<FormControl<string>>();
  readonly errorMessages = input<Record<string, string>>({});
  readonly length = input(6);
}
