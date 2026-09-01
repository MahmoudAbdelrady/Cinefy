/// <reference lib="es2020.intl" />
import { Component, computed, DestroyRef, inject, input, type InputSignal } from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { startWith, switchMap } from "rxjs";
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/mobile";
import examples from "libphonenumber-js/examples.mobile.json";

export type PhoneCountryCode = CountryCode;
import { PhoneIcon } from "../icons";
import { CuiSelect } from "../drop-down/cui-select/cui-select";
import { InputFieldV2 } from "../input-field/input-field-v2";

interface CountryOption {
  code: CountryCode;
  name: string;
  label: string;
  shortLabel: string;
}

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => {
    const name = COUNTRY_NAMES.of(code) ?? code;
    const dialCode = getCountryCallingCode(code);
    return {
      code,
      name,
      label: `(+${dialCode}) ${name}`,
      shortLabel: `+${dialCode}`,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY: CountryCode = "EG";

export function phoneNumberValidator(countryControl: FormControl<CountryCode>) {
  return (control: { value: string }) => {
    const national = control.value;
    const country = countryControl.value;
    if (!national || !country) return null;
    return isValidPhoneNumber(national, country) ? null : { invalidPhone: true };
  };
}

export function toE164Digits(countryControl: FormControl<CountryCode>, national: string): string {
  return `${getCountryCallingCode(countryControl.value)}${national}`;
}

export function parsePhoneDigits(phoneNumber: string): { country: CountryCode; nationalNumber: string } {
  const parsed = parsePhoneNumberFromString(`+${phoneNumber}`);
  return {
    country: parsed?.country ?? DEFAULT_COUNTRY,
    nationalNumber: parsed?.nationalNumber ?? phoneNumber,
  };
}

@Component({
  selector: "phone-input",
  imports: [CuiSelect, InputFieldV2],
  templateUrl: "./phone-input.html",
  styleUrl: "./phone-input.scss",
})
export class PhoneInput {
  protected readonly icons = { PhoneIcon };

  private readonly destroyRef = inject(DestroyRef);

  protected readonly countryOptions = COUNTRY_OPTIONS;

  readonly countryControl = input.required<FormControl<CountryCode>>();
  readonly numberControl = input.required<FormControl<string>>();
  readonly label: InputSignal<string | null> = input<string | null>("Phone number");
  readonly required = input<boolean>(true);
  readonly container: InputSignal<string | HTMLElement | null> = input<string | HTMLElement | null>(null);
  readonly errorMessages = input<Record<string, string>>({
    required: "Phone number is required",
    invalidPhone: "Phone number is invalid for the selected country",
  });

  private readonly countryValue = toSignal(
    toObservable(this.countryControl).pipe(switchMap((control) => control.valueChanges.pipe(startWith(control.value)))),
  );

  protected readonly placeholder = computed(() => {
    const code = this.countryValue() ?? this.countryControl().value;
    const example = getExampleNumber(code, examples);
    return example ? `e.g. ${example.nationalNumber}` : "Phone number";
  });

  constructor() {
    toObservable(this.countryControl)
      .pipe(
        switchMap((control) => control.valueChanges),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.numberControl().updateValueAndValidity());
  }
}
