import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AtSign, KeyRound, LucideAngularModule, User } from 'lucide-angular';
import { CheckIcon, EmailIcon, PhoneIcon } from '../../../shared/icons';
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import { NgpRadioGroup, NgpRadioItem } from 'ng-primitives/radio';
import { ModalComponent } from '../../modal/modal';
import { InputField } from '../../input-field/input-field';
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type EmploymentType,
  type StaffMemberDetail,
  type StaffMemberPayload,
  type StaffMemberSummary,
  type StaffPosition,
  type WeekDay,
} from '../../../shared/types';
import { StaffService, ToastService } from '../../../services';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { TimePicker } from '../../date-time/time-picker/time-picker';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const NAME_PATTERN = /^\p{L}+([ '\-]\p{L}+)*$/u;
const USERNAME_PATTERN = /^[a-z](?:[a-z0-9]|[._-](?=[a-z0-9]))*$/;
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: COUNTRY_NAMES.of(code) ?? code,
    dialCode: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
const DEFAULT_COUNTRY: CountryCode = 'EG';

@Component({
  selector: 'manage-staff-modal',
  imports: [
    ModalComponent,
    InputField,
    CustomSelectComponent,
    LucideAngularModule,
    NgpRadioGroup,
    NgpRadioItem,
    ReactiveFormsModule,
    TimePicker,
    LoadingSpinnerComponent,
  ],
  templateUrl: './manage-staff-modal.html',
  styleUrl: './manage-staff-modal.scss',
})
export class ManageStaffModalComponent {
  protected readonly icons = {
    CheckIcon,
    EmailIcon,
    PhoneIcon,
    NameIcon: User,
    UsernameIcon: AtSign,
    KeyIcon: KeyRound,
  };
  protected readonly EMPLOYMENT_TYPE_LABELS = EMPLOYMENT_TYPE_LABELS;

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<() => void>();
  readonly staffMemberId = input<string | null>(null);
  readonly selectedStaffMember = input<StaffMemberDetail | null>(null);
  readonly staffMemberCreated = output<StaffMemberSummary>();
  readonly staffMemberUpdated = output<StaffMemberSummary>();

  protected readonly resolvedStaffMember = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  private readonly initialFormSnapshot = signal<string | null>(null);

  protected readonly isEdit = computed(
    () => this.selectedStaffMember() !== null || this.staffMemberId() !== null,
  );

  protected readonly modalTitle = computed(() => {
    if (!this.isEdit()) return 'Add staff member';
    const member = this.resolvedStaffMember();
    return member ? `Edit ${member.firstName} ${member.lastName} info` : 'Edit staff member';
  });

  protected readonly modalDescription = computed(() =>
    this.isEdit()
      ? 'Update the details for this staff member.'
      : 'Add a new team member to manage Cinefy.',
  );

  protected readonly staffPositions = Object.keys(STAFF_POSITION_LABELS) as StaffPosition[];
  protected readonly weekDays = Object.keys(WEEK_DAY_LABELS) as WeekDay[];
  protected readonly countryOptions = COUNTRY_OPTIONS;
  protected readonly countryDisplayFn = (option: CountryOption): string =>
    `+${option.dialCode} ${option.name}`;
  protected readonly countryTriggerDisplayFn = (option: CountryOption): string =>
    `+${option.dialCode}`;
  protected readonly countryCompareFn = (a: CountryOption, b: CountryOption): boolean =>
    a.code === b.code;

  protected readonly phonePlaceholder = computed(() => {
    this.currentFormValue();
    const country = this.staffForm.controls.phoneCountry.value;
    const example = getExampleNumber(country, examples);
    return example ? `e.g. ${example.nationalNumber}` : 'Phone number';
  });

  protected readonly employmentTypeEntries = Object.entries(EMPLOYMENT_TYPE_LABELS).map(
    ([value, label]) => ({ value: value as EmploymentType, label }),
  );

  protected readonly staffForm = new FormGroup({
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
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(USERNAME_PATTERN),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    phoneCountry: new FormControl<CountryCode>(DEFAULT_COUNTRY, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PASSWORD_PATTERN)],
    }),
    position: new FormControl<StaffPosition | null>(null, {
      validators: [Validators.required],
    }),
    employmentType: new FormControl<EmploymentType | null>(null, {
      validators: [Validators.required],
    }),
    workingDayStart: new FormControl<WeekDay | null>(null, {
      validators: [Validators.required],
    }),
    workingDayEnd: new FormControl<WeekDay | null>(null, {
      validators: [Validators.required],
    }),
    workingHourStart: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    workingHourEnd: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly currentFormValue = toSignal(this.staffForm.valueChanges, {
    initialValue: this.staffForm.getRawValue(),
  });

  protected readonly hasChanges = computed(() => {
    const snapshot = this.initialFormSnapshot();
    if (snapshot === null) return true;
    this.currentFormValue();
    return JSON.stringify(this.staffForm.getRawValue()) !== snapshot;
  });

  constructor() {
    this.staffForm.controls.workingHourEnd.addValidators((control) => {
      const start = this.staffForm.controls.workingHourStart.value;
      const end = control.value;
      if (!start || !end) return null;
      return start === end ? { sameAsStart: true } : null;
    });
    this.staffForm.controls.workingHourStart.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.staffForm.controls.workingHourEnd.updateValueAndValidity());

    this.staffForm.controls.phoneNumber.addValidators((control) => {
      const national = control.value;
      const country = this.staffForm.controls.phoneCountry.value;
      if (!national || !country) return null;
      return isValidPhoneNumber(national, country) ? null : { invalidPhone: true };
    });
    this.staffForm.controls.phoneCountry.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.staffForm.controls.phoneNumber.updateValueAndValidity());

    effect(() => {
      if (this.isEdit()) return;
      const passwordControl = this.staffForm.controls.password;
      passwordControl.addValidators(Validators.required);
      passwordControl.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      const member = this.selectedStaffMember();
      if (member) {
        this.resolvedStaffMember.set(member);
        return;
      }
      const id = this.staffMemberId();
      if (id === null) return;
      this.loading.set(true);
      this.staffService
        .getStaffMember(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (detail) => {
            this.resolvedStaffMember.set(detail);
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastService.error(err.error?.message ?? 'Failed to load staff member');
          },
        });
    });

    effect(() => {
      const member = this.resolvedStaffMember();
      if (!member) return;
      const parsedPhone = parsePhoneNumberFromString(`+${member.phoneNumber}`);
      this.staffForm.patchValue({
        firstName: member.firstName,
        lastName: member.lastName,
        username: member.username,
        email: member.email,
        phoneCountry: parsedPhone?.country ?? DEFAULT_COUNTRY,
        phoneNumber: parsedPhone?.nationalNumber ?? member.phoneNumber,
        position: member.position,
        employmentType: member.employmentType,
        workingDayStart: member.workingDayStart,
        workingDayEnd: member.workingDayEnd,
        workingHourStart: member.workingHourStart,
        workingHourEnd: member.workingHourEnd,
      });
      this.initialFormSnapshot.set(JSON.stringify(this.staffForm.getRawValue()));
    });
  }

  protected readonly positionDisplayFn = (position: StaffPosition): string =>
    STAFF_POSITION_LABELS[position];

  protected readonly weekDayDisplayFn = (day: WeekDay): string => WEEK_DAY_LABELS[day];

  protected onPositionChange(position: StaffPosition): void {
    this.staffForm.controls.position.setValue(position);
  }

  protected onPositionCleared(): void {
    this.staffForm.controls.position.setValue(null);
  }

  protected onWorkingDayStartChange(day: WeekDay): void {
    this.staffForm.controls.workingDayStart.setValue(day);
  }

  protected onWorkingDayStartCleared(): void {
    this.staffForm.controls.workingDayStart.setValue(null);
  }

  protected onWorkingDayEndChange(day: WeekDay): void {
    this.staffForm.controls.workingDayEnd.setValue(day);
  }

  protected onWorkingDayEndCleared(): void {
    this.staffForm.controls.workingDayEnd.setValue(null);
  }

  protected onPhoneCountryChange(option: CountryOption): void {
    this.staffForm.controls.phoneCountry.setValue(option.code);
  }

  protected get selectedCountryOption(): CountryOption | null {
    const code = this.staffForm.controls.phoneCountry.value;
    return COUNTRY_OPTIONS.find((opt) => opt.code === code) ?? null;
  }

  protected saveMember() {
    if (this.staffForm.invalid || this.saving()) return;

    const value = this.staffForm.getRawValue();
    const payload: StaffMemberPayload = {
      firstName: value.firstName,
      lastName: value.lastName,
      username: value.username,
      email: value.email,
      phoneNumber: `${getCountryCallingCode(value.phoneCountry)}${value.phoneNumber}`,
      position: value.position!,
      employmentType: value.employmentType!,
      workingDayStart: value.workingDayStart!,
      workingDayEnd: value.workingDayEnd!,
      workingHourStart: value.workingHourStart,
      workingHourEnd: value.workingHourEnd,
    };

    const payloadWithPassword = value.password ? { ...payload, password: value.password } : payload;
    const request$ = this.isEdit()
      ? this.staffService.updateStaffMember(this.resolvedStaffMember()!.id, payloadWithPassword)
      : this.staffService.createStaffMember(payloadWithPassword);

    this.saving.set(true);
    const isEdit = this.isEdit();
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (member) => {
        this.saving.set(false);
        if (isEdit) {
          this.staffMemberUpdated.emit(member);
          this.toastService.success('Staff member updated');
        } else {
          this.staffMemberCreated.emit(member);
          this.toastService.success('Staff member created');
        }
        this.close()();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to save staff member');
      },
    });
  }
}
