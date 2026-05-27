import { Component, computed, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Lock, LucideAngularModule, User } from 'lucide-angular';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { AtSignIcon, SaveIcon, EditIcon, EmailIcon, PhoneIcon } from '../../../shared/icons';
import { InputField } from '../../input-field/input-field';
import {
  DEFAULT_COUNTRY,
  PhoneInput,
  phoneNumberValidator,
  toE164Digits,
} from '../../phone-input/phone-input';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { PhoneFormatPipe } from '../../../shared/pipes';
import type { StaffMemberDetail } from '../../../shared/types';
import { NAME_PATTERN } from '../../../shared/validation';

@Component({
  selector: 'profile-personal-details',
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    InputField,
    PhoneInput,
    LoadingSpinnerComponent,
    PhoneFormatPipe,
  ],
  templateUrl: './profile-personal-details.html',
  styleUrl: './profile-personal-details.scss',
})
export class ProfilePersonalDetailsComponent {
  protected readonly icons = {
    EmailIcon,
    PhoneIcon,
    EditIcon,
    SaveIcon,
    UsernameIcon: AtSignIcon,
    NameIcon: User,
    LockIcon: Lock,
  };

  readonly profile = input.required<StaffMemberDetail>();

  readonly updated = output<StaffMemberDetail>();

  protected readonly isEditing = signal(false);
  protected readonly saving = signal(false);

  protected readonly personalForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    phoneCountry: new FormControl<CountryCode>(DEFAULT_COUNTRY, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly currentFormValue = toSignal(this.personalForm.valueChanges, {
    initialValue: this.personalForm.getRawValue(),
  });

  protected readonly hasChanges = computed(() => {
    const profile = this.profile();
    this.currentFormValue();
    const value = this.personalForm.getRawValue();
    const phoneNumber = toE164Digits(this.personalForm.controls.phoneCountry, value.phoneNumber);
    return (
      value.firstName !== profile.firstName ||
      value.lastName !== profile.lastName ||
      phoneNumber !== profile.phoneNumber
    );
  });

  constructor() {
    this.personalForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.personalForm.controls.phoneCountry),
    );
  }

  protected startEditing(): void {
    const profile = this.profile();
    const parsedPhone = parsePhoneNumberFromString(`+${profile.phoneNumber}`);
    this.personalForm.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneCountry: parsedPhone?.country ?? DEFAULT_COUNTRY,
      phoneNumber: parsedPhone?.nationalNumber ?? profile.phoneNumber,
    });
    this.isEditing.set(true);
  }

  protected cancelEditing(): void {
    this.isEditing.set(false);
  }

  protected save(): void {
    if (this.personalForm.invalid || this.saving() || !this.hasChanges()) return;

    const value = this.personalForm.getRawValue();
    // TODO(profile-backend): call the profile update endpoint (PATCH /staff/me) with
    // { firstName, lastName, phoneNumber } and on success emit `updated` with the
    // returned StaffMemberDetail, clear `saving`, exit editing, and toast. On error
    // clear `saving` and toast err.error?.message. Use takeUntilDestroyed(this.destroyRef)
    // since the response emits an output and toast.
    // toE164Digits(this.personalForm.controls.phoneCountry, value.phoneNumber);
  }
}
