import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  BriefCaseIcon,
  CalendarClockIcon,
  CalendarIcon,
  ClockIcon,
  LockIcon,
  ShieldCheckIcon,
} from '../../../shared/icons';
import { Time12hPipe } from '../../../shared/pipes';
import {
  EMPLOYMENT_TYPE_LABELS,
  USER_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type StaffMemberDetail,
} from '../../../shared/types';

@Component({
  selector: 'profile-identity',
  imports: [LucideAngularModule, DatePipe, Time12hPipe],
  templateUrl: './profile-identity.html',
  styleUrl: './profile-identity.scss',
})
export class ProfileIdentityComponent {
  protected readonly icons = {
    CalendarIcon,
    ClockIcon,
    BriefCaseIcon,
    LockIcon,
    ShieldCheckIcon,
    CalendarClockIcon,
  };

  protected readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly positionLabels = USER_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;

  readonly profile = input.required<StaffMemberDetail>();

  protected readonly fullName = computed(
    () => `${this.profile().firstName} ${this.profile().lastName}`,
  );

  protected readonly initials = computed(() => {
    const profile = this.profile();
    return (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase();
  });
}
