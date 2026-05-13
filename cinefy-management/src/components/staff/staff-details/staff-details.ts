import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../../modal/modal';
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_POSITION_LABELS,
  StaffMember,
  WEEK_DAY_LABELS,
} from '../../../shared/types';
import {
  AtSign,
  BriefcaseBusiness,
  Calendar,
  Clock,
  Mail,
  Phone,
  LucideAngularModule,
  SquarePen,
} from 'lucide-angular';

@Component({
  selector: 'staff-details',
  imports: [ModalComponent, LucideAngularModule],
  templateUrl: './staff-details.html',
  styleUrl: './staff-details.scss',
})
export class StaffDetailsComponent {
  protected readonly UsernameIcon = AtSign;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly CalendarIcon = Calendar;
  protected readonly ClockIcon = Clock;
  protected readonly BriefCaseIcon = BriefcaseBusiness;
  protected readonly EditIcon = SquarePen;

  readonly close = input.required<() => void>();
  readonly staffMember = input.required<StaffMember>();
  readonly editRequested = output<StaffMember>();

  protected readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly positionLabels = STAFF_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;

  protected requestEdit(): void {
    this.close()();
    this.editRequested.emit(this.staffMember());
  }
}
