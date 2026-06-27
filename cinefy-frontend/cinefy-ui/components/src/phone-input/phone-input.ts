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
import { CustomSelectComponent } from "../drop-down/custom-select/custom-select";
import { InputField } from "../input-field/input-field";

interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: COUNTRY_NAMES.of(code) ?? code,
    dialCode: getCountryCallingCode(code),
  }))
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
  imports: [CustomSelectComponent, InputField],
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

  protected readonly selectedCountryOption = computed(() => {
    const code = this.countryValue() ?? this.countryControl().value;
    return COUNTRY_OPTIONS.find((opt) => opt.code === code) ?? null;
  });

  protected readonly placeholder = computed(() => {
    const code = this.countryValue() ?? this.countryControl().value;
    const example = getExampleNumber(code, examples);
    return example ? `e.g. ${example.nationalNumber}` : "Phone number";
  });

  protected readonly countryDisplayFn = (option: CountryOption): string => `+${option.dialCode} ${option.name}`;
  protected readonly countryTriggerDisplayFn = (option: CountryOption): string => `+${option.dialCode}`;
  protected readonly countryCompareFn = (a: CountryOption, b: CountryOption): boolean => a.code === b.code;

  constructor() {
    toObservable(this.countryControl)
      .pipe(
        switchMap((control) => control.valueChanges),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.numberControl().updateValueAndValidity());
  }

  protected onCountryChange(option: CountryOption): void {
    this.countryControl().setValue(option.code);
  }
}
