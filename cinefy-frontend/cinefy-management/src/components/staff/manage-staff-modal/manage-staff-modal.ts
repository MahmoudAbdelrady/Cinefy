import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { addDays, differenceInMinutes, parse } from 'date-fns';
import { CheckIcon, EmailIcon, KeyIcon, PhoneIcon, UserIcon } from '../../../shared/icons';
import { RadioButton } from 'primeng/radiobutton';
import {
  CinefyDialog,
  CinefyDialogFooter,
  CinefyInput,
  CinefyPasswordChecklist,
  CinefySelect,
  CinefyLoadingSpinner,
  DEFAULT_COUNTRY,
  CinefyPhoneInput,
  phoneNumberValidator,
  toE164Digits,
  parsePhoneDigits,
  type PhoneCountryCode,
  CinefyTimePicker,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import {
  EMPLOYMENT_TYPE_LABELS,
  USER_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type EmploymentType,
  type StaffMemberDetail,
  type StaffMemberPayload,
  type StaffMemberSummary,
  type UserPosition,
  type WeekDay,
} from '../../../shared/types';
import { StaffService } from '../../../services';
import { EMAIL_PATTERN, NAME_PATTERN, PASSWORD_PATTERN } from '../../../shared/validation';
import { assignableStaffPositions } from '../../../shared/access';
import { TIME_FORMAT } from '../../../shared/constants';

const WEEK_DAYS = Object.keys(WEEK_DAY_LABELS) as WeekDay[];

const WORKING_DAY_RANGES: Record<EmploymentType, { min: number; max: number }> = {
  FULL_TIME: { min: 5, max: 6 },
  PART_TIME: { min: 2, max: 4 },
};

const REQUIRED_WORKING_MINUTES = 8 * 60;

function countDaysInRange(start: WeekDay, end: WeekDay): number {
  const diff = WEEK_DAYS.indexOf(end) - WEEK_DAYS.indexOf(start);
  // Wrap a negative diff into 0-6 so a week crossing Sunday still counts forward, +1 to include both days
  return (((diff % WEEK_DAYS.length) + WEEK_DAYS.length) % WEEK_DAYS.length) + 1;
}

function countMinutesInRange(start: string, end: string): number {
  const reference = new Date();
  const startTime = parse(start, TIME_FORMAT, reference);
  const endTime = parse(end, TIME_FORMAT, reference);
  return differenceInMinutes(endTime <= startTime ? addDays(endTime, 1) : endTime, startTime);
}

@Component({
  selector: 'manage-staff-modal',
  imports: [
    CinefyDialog,
    CinefyDialogFooter,
    CinefyInput,
    CinefyPasswordChecklist,
    CinefyPhoneInput,
    CinefySelect,
    RadioButton,
    ReactiveFormsModule,
    CinefyTimePicker,
    CinefyLoadingSpinner,
  ],
  templateUrl: './manage-staff-modal.html',
  styleUrl: './manage-staff-modal.scss',
})
export class ManageStaffModalComponent {
  protected readonly icons = {
    CheckIcon,
    EmailIcon,
    PhoneIcon,
    UserIcon,
    KeyIcon,
  };

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild.required(CinefyDialog);

  protected readonly EMPLOYMENT_TYPE_LABELS = EMPLOYMENT_TYPE_LABELS;
  protected readonly weekDayEntries = (Object.entries(WEEK_DAY_LABELS) as [WeekDay, string][]).map(
    ([value, label]) => ({ value, label }),
  );
  protected readonly employmentTypeEntries = Object.entries(EMPLOYMENT_TYPE_LABELS).map(
    ([value, label]) => ({ value: value as EmploymentType, label }),
  );

  readonly staffMemberId = input<string | null>(null);
  readonly selectedStaffMember = input<StaffMemberDetail | null>(null);

  readonly closed = output<void>();
  readonly staffMemberCreated = output<StaffMemberSummary>();
  readonly staffMemberUpdated = output<StaffMemberSummary>();

  protected readonly resolvedStaffMember = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  private readonly initialFormSnapshot = signal<string | null>(null);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());
  private readonly staffPositions = computed<UserPosition[]>(() => {
    const user = this.currentUser();
    return user ? assignableStaffPositions(user.position) : [];
  });

  protected readonly staffPositionEntries = computed(() =>
    this.staffPositions().map((value) => ({ value, label: USER_POSITION_LABELS[value] })),
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
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    phoneCountry: new FormControl<PhoneCountryCode>(DEFAULT_COUNTRY, {
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
    position: new FormControl<UserPosition | null>(null, {
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

  private readonly currentFormValue = toSignal(this.staffForm.valueChanges, {
    initialValue: this.staffForm.getRawValue(),
  });

  protected readonly workingDaysMessage = computed(() => {
    this.currentFormValue();
    const employmentType = this.staffForm.controls.employmentType.value;
    if (!employmentType) return '';
    const { min, max } = WORKING_DAY_RANGES[employmentType];
    const label = EMPLOYMENT_TYPE_LABELS[employmentType];
    return `A ${label} member must work between ${min} and ${max} days a week`;
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
      const end = control.value as string;
      if (!start || !end) return null;
      return countMinutesInRange(start, end) === REQUIRED_WORKING_MINUTES
        ? null
        : { workingHours: true };
    });
    this.staffForm.controls.workingHourStart.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.staffForm.controls.workingHourEnd.updateValueAndValidity());

    this.staffForm.controls.workingDayEnd.addValidators((control) => {
      const start = this.staffForm.controls.workingDayStart.value;
      const end = control.value as WeekDay | null;
      const employmentType = this.staffForm.controls.employmentType.value;
      if (!start || !end || !employmentType) return null;
      const { min, max } = WORKING_DAY_RANGES[employmentType];
      const days = countDaysInRange(start, end);
      return days < min || days > max ? { workingDays: true } : null;
    });
    merge(
      this.staffForm.controls.workingDayStart.valueChanges,
      this.staffForm.controls.employmentType.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.staffForm.controls.workingDayEnd.updateValueAndValidity());

    this.staffForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.staffForm.controls.phoneCountry),
    );

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
          error: () => this.loading.set(false),
        });
    });

    effect(() => {
      const member = this.resolvedStaffMember();
      if (!member) return;
      const { country, nationalNumber } = parsePhoneDigits(member.phoneNumber);
      this.staffForm.patchValue({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneCountry: country,
        phoneNumber: nationalNumber,
        position: member.position,
        employmentType: member.employmentType,
        workingDayStart: member.workingDayStart,
        workingDayEnd: member.workingDayEnd,
        workingHourStart: member.workingHourStart,
        workingHourEnd: member.workingHourEnd,
      });
      this.staffForm.markAllAsTouched();
      this.initialFormSnapshot.set(JSON.stringify(this.staffForm.getRawValue()));
    });
  }

  protected saveMember() {
    if (this.staffForm.invalid || this.saving()) return;

    const value = this.staffForm.getRawValue();
    const payload: StaffMemberPayload = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phoneNumber: toE164Digits(this.staffForm.controls.phoneCountry, value.phoneNumber),
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
        this.dialog().close();
      },
      error: () => this.saving.set(false),
    });
  }
}
